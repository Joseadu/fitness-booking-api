import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Notification, DeliveryStatus, NotificationType, NotificationPriority } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepo: Repository<Notification>,
        @InjectRepository(NotificationPreference)
        private preferenceRepo: Repository<NotificationPreference>,
    ) { }

    async send(dto: CreateNotificationDto): Promise<Notification> {
        const prefs = await this.getUserPreferences(dto.userId);
        const channels = this.filterChannels(dto.channels || ['in_app'], prefs, dto.type);

        const notification = this.notificationRepo.create({
            ...dto,
            channels,
            deliveryStatus: DeliveryStatus.PENDING,
        });

        await this.notificationRepo.save(notification);

        notification.deliveryStatus = DeliveryStatus.SENT;
        notification.deliveredAt = new Date();
        await this.notificationRepo.save(notification);

        return notification;
    }

    async markAsRead(id: string, userId: string): Promise<void> {
        await this.notificationRepo.update(
            { id, userId },
            { readAt: new Date(), deliveryStatus: DeliveryStatus.READ },
        );
    }

    async getUnread(userId: string): Promise<Notification[]> {
        return this.notificationRepo.find({
            where: {
                userId,
                readAt: IsNull(),
                deliveryStatus: In([DeliveryStatus.SENT, DeliveryStatus.PENDING]),
            },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async getAll(userId: string, limit: number = 5, offset: number = 0): Promise<{ notifications: Notification[], total: number }> {
        const [notifications, total] = await this.notificationRepo.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });

        return { notifications, total };
    }

    async getUserPreferences(userId: string): Promise<NotificationPreference> {
        let prefs = await this.preferenceRepo.findOne({ where: { userId } });

        if (!prefs) {
            prefs = this.preferenceRepo.create({ userId });
            await this.preferenceRepo.save(prefs);
        }

        return prefs;
    }

    // ============================================
    // Notification Type Methods
    // ============================================

    /**
     * Notify users when a class is cancelled
     * @param scheduleId - ID of the cancelled class
     * @param reason - Cancellation reason
     * @param bookings - Array of bookings for this class
     */
    async notifyClassCancelled(
        scheduleId: string,
        reason: string,
        bookings: Array<{ athleteId: string; schedule: any }>
    ): Promise<void> {
        for (const booking of bookings) {
            const schedule = booking.schedule;
            const date = new Date(schedule.date).toLocaleDateString('es-ES');
            const time = schedule.start_time?.substring(0, 5);
            const disciplineName = schedule.discipline?.name || 'la clase';

            await this.send({
                userId: booking.athleteId,
                type: NotificationType.CLASS_CANCELLED,
                title: '⚠️ Clase Cancelada',
                message: `La clase de ${disciplineName} del ${date} a las ${time} ha sido cancelada. Motivo: ${reason}`,
                data: { scheduleId, reason, date, time },
                channels: ['in_app'],
                priority: NotificationPriority.URGENT,
                actionUrl: '/bookings/my-bookings',
                actionLabel: 'Ver mis reservas',
            });
        }
    }

    /**
     * Notify invitee when they receive an invitation
     * @param invitation - Invitation entity with box and token
     */
    async notifyInvitationSent(invitation: any): Promise<void> {
        // Only create notification if user already exists
        // If they don't have an account yet, they'll see it when they sign up
        const boxName = invitation.box?.name || 'un box';
        const role = invitation.role === 'trainer' ? 'entrenador' : 'atleta';
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        // Note: We'll need to handle the case where user doesn't exist yet
        // For now, we'll create the notification and it will be visible when they create account
        await this.send({
            userId: invitation.email, // Will be linked to user when they sign up
            type: NotificationType.INVITATION_RECEIVED,
            title: '📩 Invitación a Box',
            message: `${boxName} te ha invitado a unirte como ${role}`,
            data: { invitationId: invitation.id, boxId: invitation.boxId, role: invitation.role },
            channels: ['in_app'],
            priority: NotificationPriority.NORMAL,
            actionUrl: `/invitations/accept?token=${invitation.token}`,
            actionLabel: 'Aceptar invitación',
            expiresAt,
        });
    }

    /**
     * Notify box owner when an invitation is accepted
     * @param invitation - Invitation entity with user and box info
     */
    async notifyInvitationAccepted(invitation: any): Promise<void> {
        const userName = invitation.profile?.fullName || invitation.email;
        const email = invitation.email;

        await this.send({
            userId: invitation.box.ownerId,
            type: NotificationType.INVITATION_ACCEPTED,
            title: '✅ Nueva Membresía',
            message: `${userName} (${email}) ha aceptado tu invitación y se ha unido a tu box`,
            data: { invitationId: invitation.id, userId: invitation.profileId, boxId: invitation.boxId },
            channels: ['in_app'],
            priority: NotificationPriority.NORMAL,
            actionUrl: '/athletes',
            actionLabel: 'Ver atletas',
        });
    }

    /**
     * Send class reminder to all users with bookings for tomorrow
     * @param schedule - Schedule entity with bookings
     */
    async notifyClassReminder(schedule: any): Promise<void> {
        if (!schedule.bookings || schedule.bookings.length === 0) {
            return;
        }

        const date = new Date(schedule.date).toLocaleDateString('es-ES');
        const time = schedule.start_time?.substring(0, 5);
        const disciplineName = schedule.discipline?.name || 'clase';
        const trainerName = schedule.trainer?.fullName || 'el entrenador';

        for (const booking of schedule.bookings) {
            if (booking.status === 'confirmed') {  // Fixed: was 'active', should be 'confirmed'
                await this.send({
                    userId: booking.athleteId,
                    type: NotificationType.CLASS_REMINDER_24H,
                    title: '⏰ Recordatorio de Clase',
                    message: `Tienes clase de ${disciplineName} mañana a las ${time} con ${trainerName}`,
                    data: { scheduleId: schedule.id, date, time, disciplineName, trainerName },
                    channels: ['in_app'],
                    priority: NotificationPriority.NORMAL,
                    actionUrl: '/bookings/my-bookings',
                    actionLabel: 'Ver detalles',
                });
            }
        }
    }

    /**
     * Notify user when their membership status changes
     * @param membership - Membership entity with user and box info
     * @param newStatus - New status ('active' or 'inactive')
     */
    async notifyMembershipStatusChanged(membership: any, newStatus: string): Promise<void> {
        const boxName = membership.box?.name || 'el box';
        const isActive = newStatus === 'active';

        if (isActive) {
            await this.send({
                userId: membership.athleteId,
                type: NotificationType.MEMBERSHIP_APPROVED,
                title: '🎉 Membresía Activada',
                message: `Tu membresía en ${boxName} ha sido activada. ¡Ya puedes reservar clases!`,
                data: { membershipId: membership.id, boxId: membership.boxId, status: newStatus },
                channels: ['in_app'],
                priority: NotificationPriority.NORMAL,
                actionUrl: '/bookings/available',
                actionLabel: 'Ver clases disponibles',
            });
        } else {
            await this.send({
                userId: membership.athleteId,
                type: NotificationType.MEMBERSHIP_SUSPENDED,
                title: '⚠️ Membresía Suspendida',
                message: `Tu membresía en ${boxName} ha sido desactivada. Contacta con el box para más información.`,
                data: { membershipId: membership.id, boxId: membership.boxId, status: newStatus },
                channels: ['in_app'],
                priority: NotificationPriority.HIGH,
                actionUrl: '/profile',
            });
        }
    }

    private filterChannels(
        requestedChannels: string[],
        prefs: NotificationPreference,
        type: string,
    ): string[] {
        const filtered: string[] = [];

        for (const channel of requestedChannels) {
            if (channel === 'email' && !prefs.emailEnabled) continue;
            if (channel === 'push' && !prefs.pushEnabled) continue;
            if (channel === 'in_app' && !prefs.inAppEnabled) continue;

            const typePref = prefs.preferences[type];
            if (typePref) {
                if (channel === 'email' && !typePref.email) continue;
                if (channel === 'push' && !typePref.push) continue;
                if (channel === 'in_app' && !typePref.in_app) continue;
            }

            filtered.push(channel);
        }

        return filtered.length > 0 ? filtered : ['in_app'];
    }
}
