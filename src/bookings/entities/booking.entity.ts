import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bookings')
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column('uuid', { name: 'box_id' })
    boxId: string;

    @Column('uuid', { name: 'schedule_id' })
    scheduleId: string;

    @Column('uuid', { name: 'athlete_id' })
    athleteId: string;

    @Column('text', { name: 'status', default: 'active' }) // active, cancelled
    status: string;

    @Column('date', { name: 'date', nullable: true }) // redundancy usually found in bookings
    date: string;
}
