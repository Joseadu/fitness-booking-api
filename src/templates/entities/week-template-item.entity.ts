import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('week_template_items')
export class WeekTemplateItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column('uuid', { name: 'week_template_id' })
    weekTemplateId: string;

    @Column('integer', { name: 'day_of_week' })
    dayOfWeek: number; // 0-6 or 1-7

    @Column('time', { name: 'start_time' })
    startTime: string;

    @Column('integer', { name: 'duration_minutes' })
    durationMinutes: number;

    @Column('uuid', { name: 'discipline_id', nullable: true })
    disciplineId: string;

    @Column('uuid', { name: 'coach_id', nullable: true })
    coachId: string;

    @Column('integer', { name: 'capacity', default: 0 })
    capacity: number;
}
