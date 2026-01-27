import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Box } from '../../boxes/entities/box.entity';
import { Discipline } from '../../disciplines/entities/discipline.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Expose } from 'class-transformer';

@Entity('schedules')
export class Schedule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column('uuid', { name: 'box_id' })
    box_id: string;

    @ManyToOne(() => Box)
    @JoinColumn({ name: 'box_id' })
    box: Box;

    // FECHAS Y HORAS SEPARADAS (Real DB Schema)
    @Column('date', { name: 'date' })
    date: string;

    @Column('time', { name: 'start_time' })
    start_time: string;

    @Column('time', { name: 'end_time' })
    end_time: string;

    @Column('uuid', { name: 'discipline_id', nullable: true })
    discipline_id: string;

    @ManyToOne(() => Discipline)
    @JoinColumn({ name: 'discipline_id' })
    discipline: Discipline;

    @Column('uuid', { name: 'trainer_id', nullable: true })
    trainer_id: string;

    // TODO: Relation with Trainer/User

    @Column('integer', { name: 'max_capacity', default: 0 })
    max_capacity: number;

    @Column('boolean', { name: 'is_visible', default: true })
    is_visible: boolean;

    @Column('boolean', { name: 'is_cancelled', default: false })
    is_cancelled: boolean;

    @Column('text', { name: 'cancellation_reason', nullable: true })
    cancellation_reason: string | null;

    @Column('text', { name: 'name', nullable: true })
    name: string;

    @Column('text', { name: 'description', nullable: true })
    description: string;

    @OneToMany(() => Booking, (booking) => booking.schedule)
    bookings: Booking[];
}
