import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('schedules')
export class Schedule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column('uuid', { name: 'box_id' })
    boxId: string;

    @Column('timestamptz', { name: 'start_time' })
    startTime: Date;

    @Column('timestamptz', { name: 'end_time' })
    endTime: Date;

    @Column('uuid', { name: 'discipline_id', nullable: true })
    disciplineId: string;

    @Column('uuid', { name: 'coach_id', nullable: true })
    coachId: string;

    @Column('integer', { name: 'capacity', default: 0 })
    capacity: number;

    @Column('boolean', { name: 'is_visible', default: true })
    isVisible: boolean;

    @Column('boolean', { name: 'is_cancelled', default: false })
    isCancelled: boolean;

    @Column('text', { name: 'cancel_reason', nullable: true })
    cancelReason: string;

    // Campos calculados o adicionales podrían ir aquí, pero la tabla base es esta.
    // week_template_id? verificaremos en el output.
}
