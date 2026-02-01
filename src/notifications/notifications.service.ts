import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Notification, DeliveryStatus } from './entities/notification.entity';
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
