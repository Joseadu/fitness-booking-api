import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
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

    async findAllByBox(boxId: string, userId: string, fromDate?: string, toDate?: string, includeDrafts: boolean = false): Promise<ScheduleResponseDto[]> {
        const where: any = {
            boxId,
        };

        // Si NO pedimos drafts, solo mostramos las visibles (Publicadas)
        if (!includeDrafts) {
            where.isVisible = true;
        }

        if (fromDate && toDate) {
            where.date = Between(fromDate, toDate);
        } else if (fromDate) {
            where.date = MoreThanOrEqual(fromDate);
        } else if (toDate) {
            where.date = LessThanOrEqual(toDate);
        }

        const schedules = await this.scheduleRepository.find({
            where,
            relations: ['discipline', 'bookings', 'bookings.athlete'],
            order: { date: 'ASC', startTime: 'ASC' },
        });

        return schedules.map(schedule => {
            const confirmedBookings = schedule.bookings
                ? schedule.bookings
                    .filter(b => b.status === 'confirmed')
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                : [];
            const count = confirmedBookings.length;
            const userBooking = confirmedBookings.find(b => b.athleteId === userId);
            const userHasBooked = !!userBooking;

            return {
                id: schedule.id,
                date: schedule.date,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                isVisible: (schedule as any).isVisible ?? (schedule as any).is_visible ?? true,
                isCancelled: (schedule as any).isCancelled ?? (schedule as any).is_cancelled ?? false,
                cancelReason: schedule.cancellationReason || undefined,
                capacity: (schedule as any).maxCapacity ?? (schedule as any).max_capacity ?? 15,
                maxCapacity: (schedule as any).maxCapacity ?? (schedule as any).max_capacity ?? 15,
                currentBookings: count,
                spotsAvailable: Math.max(0, ((schedule as any).maxCapacity || 15) - count),
                userHasBooked: userHasBooked,
                userBookingId: userBooking?.id,
                discipline: {
                    id: schedule.discipline?.id,
                    name: schedule.discipline?.name,
                    color: schedule.discipline?.color
                },
                coach: schedule.trainerId ? { id: schedule.trainerId, name: 'Coach' } : undefined,
                bookings: confirmedBookings.map(booking => ({
                    id: booking.athlete?.id,
                    fullName: booking.athlete?.fullName,
                    avatarUrl: booking.athlete?.avatarUrl
                }))
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
    async cancel(ids: string[], reason: string) {
        if (!ids || ids.length === 0) return;

        // Bulk Update
        await this.scheduleRepository.update(
            { id: In(ids) },
            {
                isCancelled: true,
                cancellationReason: reason,
                isVisible: false
            }
        );
    }

    // REACTIVATE
    async reactivate(ids: string[]) {
        if (!ids || ids.length === 0) return;

        await this.scheduleRepository.update(
            { id: In(ids) },
            {
                isCancelled: false,
                cancellationReason: null,
                isVisible: true
            }
        );
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

    // PUBLISH WEEK
    async publishWeek(boxId: string, weekStartStr: string): Promise<void> {
        // Calcular rango de fechas
        const start = new Date(weekStartStr);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        // Update masivo inteligente: Solo las ocultas y activas
        await this.scheduleRepository.update(
            {
                boxId,
                date: Between(start.toISOString().split('T')[0], end.toISOString().split('T')[0]),
                isVisible: false,
                isCancelled: false
            },
            { isVisible: true }
        );
    }



}
