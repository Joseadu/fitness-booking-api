import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { Booking } from '../bookings/entities/booking.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulesService {
    constructor(
        @InjectRepository(Schedule)
        private scheduleRepository: Repository<Schedule>,
        @InjectRepository(Booking)
        private bookingRepository: Repository<Booking>,
        private notificationsService: NotificationsService,
    ) { }

    async findAllByBox(boxId: string, userId: string, fromDate?: string, toDate?: string, includeDrafts: boolean = false): Promise<ScheduleResponseDto[]> {
        const where: any = {
            box_id: boxId,
        };

        // Si NO pedimos drafts, solo mostramos las visibles (Publicadas)
        if (!includeDrafts) {
            where.is_visible = true;
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
            relations: ['discipline', 'trainer', 'bookings', 'bookings.athlete'],
            order: { date: 'ASC', start_time: 'ASC' },
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

            // TODO: Use a proper DTO or ClassSerializer instead of manual map
            return {
                id: schedule.id,
                date: schedule.date,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                is_visible: schedule.is_visible,
                is_cancelled: schedule.is_cancelled,
                cancellation_reason: schedule.cancellation_reason,
                max_capacity: schedule.max_capacity,
                current_bookings: count,
                spots_available: Math.max(0, (schedule.max_capacity || 15) - count),
                user_has_booked: userHasBooked,
                user_booking_id: userBooking?.id,
                discipline: {
                    id: schedule.discipline?.id,
                    name: schedule.discipline?.name,
                    color: schedule.discipline?.color,
                    description: schedule.discipline?.description,
                    video_url: schedule.discipline?.video_url
                },
                coach: schedule.trainer ? { id: schedule.trainer.id, name: schedule.trainer.fullName } : undefined,
                bookings: confirmedBookings.map(booking => ({
                    id: booking.athlete?.id,
                    full_name: booking.athlete?.fullName,
                    avatar_url: booking.athlete?.avatarUrl
                }))
            } as any; // Temporary cast until ScheduleResponseDto is snake_case
        });
    }

    async create(dtos: CreateScheduleDto[], user: any): Promise<Schedule[]> {
        const schedulesToSave: Schedule[] = [];

        for (const dto of dtos) {
            // Verify ownership for each box involved (usually just one)
            this.verifyOwnership(dto.box_id, user);

            const { date, start_time, end_time, max_capacity, trainer_id, box_id, is_visible, ...rest } = dto;
            const finalCapacity = max_capacity || 15;

            const schedule = this.scheduleRepository.create({
                ...rest,
                box_id,
                date,
                start_time,
                end_time,
                max_capacity: finalCapacity,
                trainer_id,

                is_visible: is_visible ?? false,

                is_cancelled: false
            });

            schedulesToSave.push(schedule);
        }

        // Guardado masivo
        return this.scheduleRepository.save(schedulesToSave);
    }

    async copyWeek(boxId: string, fromDate: string, toDate: string, user: any): Promise<void> {
        this.verifyOwnership(boxId, user);

        // fromDate y toDate son 'YYYY-MM-DD'.
        // Como la columna es DATE, podemos usar Between strings directos.

        const sources = await this.scheduleRepository.find({
            where: {
                box_id: boxId,
                date: Between(fromDate, toDate),
                is_cancelled: false,
            }
        });

        const newSchedules = sources.map(source => {
            // Sumar 7 días a la fecha string
            const oldDate = new Date(source.date);
            const newDateObj = new Date(oldDate);
            newDateObj.setDate(newDateObj.getDate() + 7);
            const newDateStr = newDateObj.toISOString().split('T')[0];

            return this.scheduleRepository.create({
                box_id: source.box_id,
                discipline_id: source.discipline_id,
                max_capacity: source.max_capacity,
                trainer_id: source.trainer_id,
                is_visible: false, // Draft
                // Copiar horas tal cual
                date: newDateStr,
                start_time: source.start_time,
                end_time: source.end_time,
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
    async update(id: string, dto: any, user: any) {
        const schedule = await this.scheduleRepository.findOne({ where: { id } });
        if (!schedule) throw new NotFoundException('Clase no encontrada');

        this.verifyOwnership(schedule.box_id, user);

        // Actualizar campos permitidos
        if (dto.discipline_id) schedule.discipline_id = dto.discipline_id;
        if (dto.trainer_id !== undefined) schedule.trainer_id = dto.trainer_id; // Allow null to remove trainer
        if (dto.start_time) schedule.start_time = dto.start_time;
        if (dto.end_time) schedule.end_time = dto.end_time;
        if (dto.max_capacity) schedule.max_capacity = dto.max_capacity;
        if (dto.name !== undefined) schedule.name = dto.name;
        if (dto.description !== undefined) schedule.description = dto.description;
        // if (dto.notes !== undefined) schedule.notes = dto.notes; // Notes no existe en Entity aun
        // Importante: Permitir toggle de visibilidad
        if (dto.is_visible !== undefined) schedule.is_visible = dto.is_visible;

        return this.scheduleRepository.save(schedule);
    }

    // CANCEL
    async cancel(ids: string[], reason: string, user: any) {
        if (!ids || ids.length === 0) return;

        // Verify ownership OR trainer role for all affected schedules
        const schedules = await this.scheduleRepository.find({
            where: { id: In(ids) },
            relations: ['discipline', 'trainer', 'bookings', 'bookings.athlete', 'box']
        });

        for (const schedule of schedules) {
            // Check if user is owner OR trainer of this class
            const isOwner = user.memberships?.some(
                (m: any) => m.boxId === schedule.box_id && m.role === 'business_owner'
            );
            const isTrainer = schedule.trainer_id === user.id;

            if (!isOwner && !isTrainer) {
                throw new ForbiddenException(
                    'Only owners and trainers can cancel classes'
                );
            }
        }

        // Bulk Update
        await this.scheduleRepository.update(
            { id: In(ids) },
            {
                is_cancelled: true,
                cancellation_reason: reason,
                is_visible: false
            }
        );

        // Send notifications to all users with active bookings
        for (const schedule of schedules) {
            const activeBookings = schedule.bookings?.filter(
                (b) => b.status === 'confirmed'  // Fixed: was 'active', should be 'confirmed'
            ) || [];

            if (activeBookings.length > 0) {
                await this.notificationsService.notifyClassCancelled(
                    schedule.id,
                    reason || 'No se especificó motivo',
                    activeBookings.map(b => ({
                        athleteId: b.athleteId,
                        schedule: schedule
                    }))
                );
            }
        }
    }

    // REACTIVATE
    async reactivate(ids: string[], user: any) {
        if (!ids || ids.length === 0) return;

        const schedules = await this.scheduleRepository.find({ where: { id: In(ids) }, select: ['box_id'] });
        const boxIds = [...new Set(schedules.map(s => s.box_id))];
        boxIds.forEach(bid => this.verifyOwnership(bid, user));

        await this.scheduleRepository.update(
            { id: In(ids) },
            {
                is_cancelled: false,
                cancellation_reason: null,
                is_visible: true
            }
        );
    }

    // HELPER (Si no lo tienes ya, úsalo en findAll y findOne)
    private mapScheduleResponse(schedule: any) {
        return {
            ...schedule,
            is_visible: schedule.is_visible ?? schedule.is_visible ?? true,
            isCancelled: schedule.isCancelled ?? schedule.is_cancelled ?? false,
            maxCapacity: schedule.maxCapacity ?? schedule.max_capacity ?? 15,
            cancelReason: (schedule.cancellationReason ?? schedule.cancelReason) || undefined,
            // Asegulamos disciplina y coach si no vienen
            discipline: schedule.discipline ? {
                id: schedule.discipline.id,
                name: schedule.discipline.name,
                color: schedule.discipline.color
            } : undefined,
            coach: schedule.trainer ? { id: schedule.trainer.id, name: schedule.trainer.fullName } : undefined,
        };
    }

    async delete(ids: string[], user: any): Promise<void> {
        if (!ids || ids.length === 0) return;

        const schedules = await this.scheduleRepository.find({ where: { id: In(ids) }, select: ['box_id'] });
        const boxIds = [...new Set(schedules.map(s => s.box_id))];
        boxIds.forEach(bid => this.verifyOwnership(bid, user));


        // Borra por bloque, muy eficiente
        await this.scheduleRepository.delete(ids);
    }

    // PUBLISH WEEK
    async publishWeek(boxId: string, weekStartStr: string, user: any): Promise<void> {
        this.verifyOwnership(boxId, user);

        // Calcular rango de fechas
        const start = new Date(weekStartStr);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        // Update masivo inteligente: Solo las ocultas y activas
        await this.scheduleRepository.update(
            {
                box_id: boxId,
                date: Between(start.toISOString().split('T')[0], end.toISOString().split('T')[0]),
                is_visible: false,
                is_cancelled: false
            },
            { is_visible: true }
        );
    }



    private verifyOwnership(boxId: string, user: any) {
        if (!user || !user.memberships) {
            throw new ForbiddenException('No membership context found');
        }

        const hasPermission = user.roles.includes('admin') || user.memberships.some((m: any) =>
            m.boxId === boxId && ['business_owner', 'admin', 'coach'].includes(m.role)
        );

        if (!hasPermission) {
            throw new ForbiddenException(`You do not have permission to manage content for Box ${boxId}`);
        }
    }
}
