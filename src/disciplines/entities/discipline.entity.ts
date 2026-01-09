import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('disciplines')
export class Discipline {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' }) // Recomendado añadir
    updatedAt: Date;
    @Column('text')
    name: string;
    @Column('uuid', { name: 'box_id' })
    boxId: string;
    @Column('text', { nullable: true })
    color: string;
    @Column('text', { nullable: true })
    description: string;
    // --- CAMPOS FALTANTES QUE EL FRONTEND NECESITA ---
    @Column('integer', { name: 'duration_minutes', default: 60 })
    durationMinutes: number;
    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;
    @Column('integer', { name: 'display_order', default: 0 })
    displayOrder: number;
}