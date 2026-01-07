import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('disciplines')
export class Discipline {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column('text')
    name: string;

    @Column('uuid', { name: 'box_id' })
    boxId: string;

    @Column('text', { nullable: true })
    color: string;

    @Column('text', { nullable: true })
    description: string;
}
