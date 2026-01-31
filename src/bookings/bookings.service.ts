import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';

@Injectable()
export class BookingsService {
    constructor(
        @InjectRepository(Booking)
        private bookingRepository: Repository<Booking>,
        @InjectRepository(Schedule)
        private scheduleRepository: Repository<Schedule>,
        @InjectRepository(BoxMembership)
        private membershipRepository: Repository<BoxMembership>,
    ) { }

    async bookClass(scheduleId: string, userId: string): Promise<void> {
        // 1. Obtener la clase
        const schedule = await this.scheduleRepository.findOne({
            where: { id: scheduleId },
            relations: ['bookings']
        });
        if (!schedule) throw new NotFoundException('Clase no encontrada');
        if (schedule.is_cancelled) throw new BadRequestException('La clase está cancelada');

        // 2. CHECK MEMBERSHIP STATUS (Security)
        const membership = await this.membershipRepository.findOne({
            where: {
                user_id: userId,
                box_id: schedule.box_id
            }
        });

        if (!membership || !membership.is_active) {
            throw new BadRequestException('Tu suscripción está inactiva o no eres miembro de este box.');
        }

        // 2.5 CHECK CAPACITY (Safety Net)
        // Count confirmed bookings for this schedule
        const currentBookingsCount = await this.bookingRepository.count({
            where: {
                scheduleId: scheduleId,
                status: 'confirmed'
            }
        });

        if (currentBookingsCount >= schedule.max_capacity) {
            throw new BadRequestException('La clase está completa.');
        }

        // 3. Comprobar si ya tiene reserva activa (evitar duplicados)
        const existing = await this.bookingRepository.findOne({
            where: {
                scheduleId,
                athleteId: userId,
                status: 'confirmed'
            }
        });
        if (existing) {
            // Ya tiene reserva, no hacemos nada (idempotente)
            return;
        }

        // 4. Crear la reserva
        const booking = this.bookingRepository.create({
            scheduleId,
            athleteId: userId,
            status: 'confirmed',
            createdAt: new Date()
        });
        await this.bookingRepository.save(booking);
    }

    async unsubscribe(scheduleId: string, userId: string): Promise<void> {
        const booking = await this.bookingRepository.findOne({
            where: {
                scheduleId,
                athleteId: userId,
                status: 'confirmed'
            }
        });

        if (!booking) {
            throw new NotFoundException('No active booking found for this schedule');
        }

        await this.bookingRepository.remove(booking);
    }

    async findMyBookings(userId: string): Promise<any[]> {
        // Buscar reservas activas del usuario
        const bookings = await this.bookingRepository.find({
            where: {
                athleteId: userId,
                status: 'confirmed'
            },
            relations: ['schedule', 'schedule.discipline', 'schedule.trainer'], // Join con Schedule, Discipline y Trainer
            order: {
                schedule: {
                    date: 'ASC',
                    start_time: 'ASC'
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
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                capacity: schedule.max_capacity,
                currentBookings: 0,
                spotsAvailable: 0,
                userHasBooked: true,
                userBookingId: booking.id,
                isCancelled: schedule.is_cancelled,
                cancelReason: schedule.cancellation_reason || undefined,
                discipline: {
                    id: schedule.discipline?.id,
                    name: schedule.discipline?.name,
                    color: schedule.discipline?.color
                },
                coach: schedule.trainer ? { id: schedule.trainer.id, name: schedule.trainer.fullName } : undefined,
            };
        }).filter(item => item !== null); // Filtrar nulos
    }
}
