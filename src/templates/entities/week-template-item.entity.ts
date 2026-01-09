import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WeekTemplate } from './week-template.entity';
import { Discipline } from '../../disciplines/entities/discipline.entity';
// import { User } from '../../users/entities/user.entity'; // Cuando exista UsersModule

@Entity('week_template_items')
export class WeekTemplateItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'template_id' })
    templateId: string;

    @ManyToOne(() => WeekTemplate, (template) => template.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'template_id' })
    template: WeekTemplate;

    @Column('uuid', { name: 'discipline_id' })
    disciplineId: string;

    @ManyToOne(() => Discipline)
    @JoinColumn({ name: 'discipline_id' })
    discipline: Discipline;

    @Column('uuid', { name: 'trainer_id', nullable: true })
    trainerId: string;

    // TODO: Relation with Trainer/User
    // @ManyToOne(() => User)
    // @JoinColumn({ name: 'trainer_id' })
    // trainer: User;

    @Column('integer', { name: 'day_of_week' })
    dayOfWeek: number; // 1=Lunes, 7=Domingo

    @Column('time', { name: 'start_time' })
    startTime: string;

    @Column('time', { name: 'end_time' })
    endTime: string;

    @Column('integer', { name: 'max_capacity', default: 15 })
    maxCapacity: number;

    @Column('text', { nullable: true })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
