import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('boxes')
export class Box {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @Column('uuid', { name: 'owner_id' })
    ownerId: string;

    @Column('text')
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('text', { nullable: true })
    address: string;

    @Column('text', { nullable: true })
    phone: string;

    @Column('text', { nullable: true })
    email: string;

    @Column('text', { name: 'logo_url', nullable: true })
    logoUrl: string;

    @Column('jsonb', { nullable: true, default: {} })
    settings: any;

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;
}
