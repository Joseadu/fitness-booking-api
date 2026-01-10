import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class SchedulesService {
    constructor(
        @InjectRepository(Schedule)
        private scheduleRepository: Repository<Schedule>,
    ) { }

    async findAllByBox(boxId: string, userId: string, fromDate?: string, toDate?: string): Promise<ScheduleResponseDto[]> {
        const where: any = {
            boxId,
        };

        if (fromDate && toDate) {
            where.date = Between(fromDate, toDate);
        } else if (fromDate) {
            where.date = MoreThanOrEqual(fromDate);
        } else if (toDate) {
            where.date = LessThanOrEqual(toDate);
        }

        const schedules = await this.scheduleRepository.find({
            where,
            relations: ['discipline', 'bookings'],
            order: { date: 'ASC', startTime: 'ASC' },
        });

        return schedules.map(schedule => {
            const confirmedBookings = schedule.bookings ? schedule.bookings.filter(b => b.status === 'active') : [];
            const count = confirmedBookings.length;
            const userHasBooked = confirmedBookings.some(b => b.athleteId === userId);

            // Mapeo explicito para asegurar CamelCase en frontend
            return {
                id: schedule.id,
                date: schedule.date,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                // Asegurar booleans (por si viene snake_case de DB cruda)
                isVisible: (schedule as any).isVisible ?? (schedule as any).is_visible ?? true,
                isCancelled: (schedule as any).isCancelled ?? (schedule as any).is_cancelled ?? false,
                cancelReason: schedule.cancellationReason || undefined,

                // Capacidad segura
                capacity: (schedule as any).maxCapacity ?? (schedule as any).max_capacity ?? 15,
                maxCapacity: (schedule as any).maxCapacity ?? (schedule as any).max_capacity ?? 15,

                currentBookings: count,
                spotsAvailable: Math.max(0, ((schedule as any).maxCapacity || 15) - count),
                userHasBooked: userHasBooked,

                discipline: {
                    id: schedule.discipline?.id,
                    name: schedule.discipline?.name,
                    color: schedule.discipline?.color
                },
                coach: schedule.trainerId ? { id: schedule.trainerId, name: 'Coach' } : undefined,
            };
        });
    }

    async create(dtos: CreateScheduleDto[]): Promise<Schedule[]> {
        const schedulesToSave: Schedule[] = [];

        for (const dto of dtos) {
            // Extraemos isVisible explícitamente
            const { date, startTime, endTime, maxCapacity, capacity, trainerId, boxId, isVisible, ...rest } = dto;
            const finalCapacity = maxCapacity || capacity || 15;

            const schedule = this.scheduleRepository.create({
                ...rest,
                boxId, // Aseguramos boxId
                date,
                startTime,
                endTime,
                maxCapacity: finalCapacity,
                trainerId,

                // Usamos el valor del DTO, o false si no viene (Borrador por defecto)
                isVisible: isVisible ?? false,

                isCancelled: false
            });

            schedulesToSave.push(schedule);
        }

        // Guardado masivo
        return this.scheduleRepository.save(schedulesToSave);
    }

    async copyWeek(boxId: string, fromDate: string, toDate: string): Promise<void> {
        // fromDate y toDate son 'YYYY-MM-DD'.
        // Como la columna es DATE, podemos usar Between strings directos.

        const sources = await this.scheduleRepository.find({
            where: {
                boxId,
                date: Between(fromDate, toDate),
                isCancelled: false,
            }
        });

        const newSchedules = sources.map(source => {
            // Sumar 7 días a la fecha string
            const oldDate = new Date(source.date);
            const newDateObj = new Date(oldDate);
            newDateObj.setDate(newDateObj.getDate() + 7);
            const newDateStr = newDateObj.toISOString().split('T')[0];

            return this.scheduleRepository.create({
                boxId: source.boxId,
                disciplineId: source.disciplineId,
                maxCapacity: source.maxCapacity,
                trainerId: source.trainerId,
                isVisible: false, // Draft
                // Copiar horas tal cual
                date: newDateStr,
                startTime: source.startTime,
                endTime: source.endTime,
                name: source.name,
                description: source.description
            });
        });

        if (newSchedules.length > 0) {
            await this.scheduleRepository.save(newSchedules);
        }
    }

    async unsubscribe(scheduleId: string, userId: string): Promise<void> {
        const bookingRepo = this.scheduleRepository.manager.getRepository(Booking);

        const booking = await bookingRepo.findOne({
            where: {
                scheduleId,
                athleteId: userId,
                status: 'active'
            }
        });

        if (!booking) {
            throw new NotFoundException('No active booking found for this schedule');
        }

        await bookingRepo.remove(booking);
    }

    async findMyBookings(userId: string): Promise<ScheduleResponseDto[]> {
        const bookingRepo = this.scheduleRepository.manager.getRepository(Booking);

        // Buscar reservas activas del usuario
        const bookings = await bookingRepo.find({
            where: {
                athleteId: userId,
                // status: 'active' // Descomenta si usas status
            },
            relations: ['schedule', 'schedule.discipline'], // Join con Schedule y Discipline
            order: {
                schedule: {
                    date: 'ASC',
                    startTime: 'ASC'
                }
            }
        });

        // Mapear al formato DTO
        return bookings.map(booking => {
            const schedule = booking.schedule;

            // Si la clase se borró pero la reserva sigue (caso raro), no petamos
            if (!schedule) return null;

            return {
                id: schedule.id,
                date: schedule.date,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                capacity: schedule.maxCapacity,
                // currentBookings y spotsAvailable serían queries extra, 
                // para listado "my bookings" podemos devolver 0 o null si no es crítico.
                currentBookings: 0,
                spotsAvailable: 0,
                userHasBooked: true,
                userBookingId: booking.id,
                isCancelled: schedule.isCancelled,
                cancelReason: schedule.cancellationReason || undefined, // Convert null to undefined
                discipline: {
                    id: schedule.discipline?.id,
                    name: schedule.discipline?.name,
                    color: schedule.discipline?.color
                },
                coach: schedule.trainerId ? { id: schedule.trainerId, name: 'Coach' } : undefined,
            };
        }).filter(item => item !== null); // Filtrar nulos
    }

    // GET ONE
    async findOne(id: string) {
        const schedule = await this.scheduleRepository.findOne({
            where: { id },
            relations: ['discipline', 'bookings']
        });
        if (!schedule) throw new NotFoundException('Clase no encontrada');

        return this.mapScheduleResponse(schedule);
    }

    // UPDATE
    async update(id: string, dto: any) {
        const schedule = await this.scheduleRepository.findOne({ where: { id } });
        if (!schedule) throw new NotFoundException('Clase no encontrada');

        // Actualizar campos permitidos
        if (dto.startTime) schedule.startTime = dto.startTime;
        if (dto.endTime) schedule.endTime = dto.endTime;
        if (dto.maxCapacity) schedule.maxCapacity = dto.maxCapacity;
        if (dto.name !== undefined) schedule.name = dto.name;
        if (dto.description !== undefined) schedule.description = dto.description;
        // if (dto.notes !== undefined) schedule.notes = dto.notes; // Notes no existe en Entity aun
        // Importante: Permitir toggle de visibilidad
        if (dto.isVisible !== undefined) schedule.isVisible = dto.isVisible;

        return this.scheduleRepository.save(schedule);
    }

    // CANCEL
    async cancel(id: string, reason: string) {
        const schedule = await this.scheduleRepository.findOne({ where: { id } });
        if (!schedule) throw new NotFoundException('Clase no encontrada');

        schedule.isCancelled = true;
        schedule.cancellationReason = reason; // Entity property is cancellationReason, not cancelReason (check entity)
        // Entity: @Column('text', { name: 'cancellation_reason', nullable: true }) cancellationReason: string;
        // User snippet used cancelReason, but entity has cancellationReason. Adjusted.
        schedule.isVisible = false;

        return this.scheduleRepository.save(schedule);
    }

    // REACTIVATE
    async reactivate(id: string) {
        const schedule = await this.scheduleRepository.findOne({ where: { id } });
        if (!schedule) throw new NotFoundException('Clase no encontrada');

        schedule.isCancelled = false;
        schedule.cancellationReason = null;
        schedule.isVisible = true; // Al reactivar, la hacemos visible

        return this.scheduleRepository.save(schedule);
    }

    // HELPER (Si no lo tienes ya, úsalo en findAll y findOne)
    private mapScheduleResponse(schedule: any) {
        return {
            ...schedule,
            isVisible: schedule.isVisible ?? schedule.is_visible ?? true,
            isCancelled: schedule.isCancelled ?? schedule.is_cancelled ?? false,
            maxCapacity: schedule.maxCapacity ?? schedule.max_capacity ?? 15,
            cancelReason: (schedule.cancellationReason ?? schedule.cancelReason) || undefined,
            // Asegulamos disciplina y coach si no vienen
            discipline: schedule.discipline ? {
                id: schedule.discipline.id,
                name: schedule.discipline.name,
                color: schedule.discipline.color
            } : undefined,
            coach: schedule.trainerId ? { id: schedule.trainerId, name: 'Coach' } : undefined,
        };
    }

    async delete(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) return;

        // Borra por bloque, muy eficiente
        await this.scheduleRepository.delete(ids);
    }
}
