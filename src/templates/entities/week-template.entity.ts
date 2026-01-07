import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('week_templates')
export class WeekTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column('text')
    name: string;

    @Column('uuid', { name: 'box_id' })
    boxId: string;
}
