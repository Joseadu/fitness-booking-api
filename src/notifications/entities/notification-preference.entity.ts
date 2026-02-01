import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';

interface NotificationTypePreference {
    email: boolean;
    push: boolean;
    in_app: boolean;
}

interface PreferencesData {
    waitlist_available: NotificationTypePreference;
    booking_confirmed: NotificationTypePreference;
    class_cancelled: NotificationTypePreference;
    reminder_24h: NotificationTypePreference;
    [key: string]: NotificationTypePreference;
}

@Entity('notification_preferences')
export class NotificationPreference {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid', unique: true })
    userId: string;

    @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: Profile;

    @Column({ name: 'email_enabled', type: 'boolean', default: true })
    emailEnabled: boolean;

    @Column({ name: 'push_enabled', type: 'boolean', default: true })
    pushEnabled: boolean;

    @Column({ name: 'in_app_enabled', type: 'boolean', default: true })
    inAppEnabled: boolean;

    @Column({
        type: 'jsonb',
        default: {
            waitlist_available: { email: true, push: true, in_app: true },
            booking_confirmed: { email: true, push: false, in_app: true },
            class_cancelled: { email: true, push: true, in_app: true },
            reminder_24h: { email: true, push: true, in_app: false },
        },
    })
    preferences: PreferencesData;
}
