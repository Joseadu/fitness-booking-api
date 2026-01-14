import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { Profile } from '../../users/entities/profile.entity';

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column('uuid', { name: 'schedule_id' })
    scheduleId: string;

    @ManyToOne(() => Schedule, (schedule) => schedule.bookings)
    @JoinColumn({ name: 'schedule_id' })
    schedule: Schedule;

    @Column('uuid', { name: 'athlete_id' })
    athleteId: string;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: 'athlete_id' })
    athlete: Profile;

    @Column('text', { name: 'status', default: 'confirmed' })
    status: string;
}
