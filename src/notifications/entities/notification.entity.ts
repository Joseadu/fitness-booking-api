import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';

export enum NotificationType {
    WAITLIST_SPOT_AVAILABLE = 'waitlist_available',
    BOOKING_CONFIRMED = 'booking_confirmed',
    BOOKING_CANCELLED = 'booking_cancelled',
    CLASS_CANCELLED = 'class_cancelled',
    CLASS_REMINDER_24H = 'reminder_24h',
    CLASS_REMINDER_1H = 'reminder_1h',
    MEMBERSHIP_APPROVED = 'membership_approved',
    MEMBERSHIP_SUSPENDED = 'membership_suspended',
    MEMBERSHIP_EXPIRING = 'membership_expiring',
    INVITATION_RECEIVED = 'invitation_received',
    INVITATION_ACCEPTED = 'invitation_accepted',
}

export enum NotificationPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum DeliveryStatus {
    PENDING = 'pending',
    SENT = 'sent',
    FAILED = 'failed',
    READ = 'read',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Profile;

    @Column({ type: 'varchar', length: 50 })
    type: NotificationType;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'jsonb', nullable: true })
    data: Record<string, any>;

    @Column({ type: 'varchar', array: true, default: ['in_app'] })
    channels: string[];

    @Column({
        type: 'varchar',
        length: 20,
        default: NotificationPriority.NORMAL,
    })
    priority: NotificationPriority;

    @Column({ name: 'read_at', type: 'timestamp', nullable: true })
    readAt: Date | null;

    @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
    deliveredAt: Date | null;

    @Column({
        name: 'delivery_status',
        type: 'varchar',
        length: 20,
        default: DeliveryStatus.PENDING,
    })
    deliveryStatus: DeliveryStatus;

    @Column({ name: 'action_url', type: 'varchar', length: 500, nullable: true })
    actionUrl: string | null;

    @Column({ name: 'action_label', type: 'varchar', length: 100, nullable: true })
    actionLabel: string | null;

    @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
    expiresAt: Date | null;
}
