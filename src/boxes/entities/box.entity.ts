import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('boxes')
export class Box {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column('text')
    name: string;

    @Column('text', { nullable: true })
    address: string;

    @Column('text', { nullable: true })
    phone: string;

    @Column('text', { nullable: true })
    email: string;

    @Column('text', { nullable: true })
    website: string;

    @Column('boolean', { default: true })
    active: boolean;
}
