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

            return {
                id: schedule.id,
                date: schedule.date,          // Direct string "YYYY-MM-DD"
                startTime: schedule.startTime, // Direct string "HH:mm:ss" usually
                endTime: schedule.endTime,
                capacity: schedule.maxCapacity,
                currentBookings: count,
                spotsAvailable: Math.max(0, schedule.maxCapacity - count),
                userHasBooked: userHasBooked,
                isCancelled: schedule.isCancelled,
                cancelReason: schedule.cancellationReason,
                discipline: {
                    id: schedule.discipline?.id,
                    name: schedule.discipline?.name,
                    color: schedule.discipline?.color
                },
                coach: schedule.trainerId ? { id: schedule.trainerId, name: 'Coach' } : undefined,
            };
        });
    }

    async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
        const { date, startTime, durationMinutes, capacity, trainerId, ...rest } = createScheduleDto;

        // Calcular endTime simple
        // OJO: Postgres TIME type es string 'HH:MM:SS'. 
        // Si queremos calcular duration, necesitamos parsear.
        const [hours, minutes] = startTime.split(':').map(Number);
        const startTotalMins = hours * 60 + minutes;
        const endTotalMins = startTotalMins + durationMinutes;

        const endHours = Math.floor(endTotalMins / 60) % 24;
        const endMins = endTotalMins % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

        const schedule = this.scheduleRepository.create({
            ...rest,
            date: date,
            startTime: startTime,
            endTime: endTime,
            maxCapacity: capacity,
            trainerId: trainerId,
        });

        return this.scheduleRepository.save(schedule);
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
                cancelReason: schedule.cancellationReason,
                discipline: {
                    id: schedule.discipline?.id,
                    name: schedule.discipline?.name,
                    color: schedule.discipline?.color
                },
                coach: schedule.trainerId ? { id: schedule.trainerId, name: 'Coach' } : undefined,
            };
        }).filter(item => item !== null); // Filtrar nulos
    }
}
