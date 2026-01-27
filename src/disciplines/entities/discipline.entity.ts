import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('disciplines')
export class Discipline extends BaseEntity {
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