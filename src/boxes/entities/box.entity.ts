import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity('boxes')
export class Box {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updated_at: Date;

    @Column('uuid', { name: 'owner_id' })
    owner_id: string;

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
    logo_url: string;

    @Column('jsonb', { nullable: true, default: {} })
    settings: any;

    @Column('boolean', { name: 'is_active', default: true })
    is_active: boolean;

    // Aliases for Frontend compatibility (Legacy)
    @Expose({ name: 'contact_email' })
    get contactEmail(): string {
        return this.email;
    }

    @Expose({ name: 'contact_phone' })
    get contactPhone(): string {
        return this.phone;
    }
}
