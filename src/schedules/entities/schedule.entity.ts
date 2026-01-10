import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Box } from '../../boxes/entities/box.entity';
// Importaremos Discipline cuando el módulo esté refactorizado o usable, por ahora ID raw o lazy.
// Asumimos Discipline entity existe en src/disciplines/entities/discipline.entity.ts
import { Discipline } from '../../disciplines/entities/discipline.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { OneToMany } from 'typeorm';

@Entity('schedules')
export class Schedule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column('uuid', { name: 'box_id' })
    boxId: string;

    @ManyToOne(() => Box)
    @JoinColumn({ name: 'box_id' })
    box: Box;

    // FECHAS Y HORAS SEPARADAS (Real DB Schema)
    @Column('date', { name: 'date' })
    date: string;

    @Column('time', { name: 'start_time' })
    startTime: string;

    @Column('time', { name: 'end_time' })
    endTime: string;

    @Column('uuid', { name: 'discipline_id', nullable: true })
    disciplineId: string;

    @ManyToOne(() => Discipline)
    @JoinColumn({ name: 'discipline_id' })
    discipline: Discipline;

    @Column('uuid', { name: 'trainer_id', nullable: true })
    trainerId: string;

    // TODO: Relation with Trainer/User

    @Column('integer', { name: 'max_capacity', default: 0 })
    maxCapacity: number;

    @Column('boolean', { name: 'is_visible', default: true })
    isVisible: boolean;

    @Column('boolean', { name: 'is_cancelled', default: false })
    isCancelled: boolean;

    @Column('text', { name: 'cancellation_reason', nullable: true })
    cancellationReason: string | null;

    @Column('text', { name: 'name', nullable: true })
    name: string;

    @Column('text', { name: 'description', nullable: true })
    description: string;

    @OneToMany(() => Booking, (booking) => booking.schedule)
    bookings: Booking[];
}
