import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('box_memberships')
export class BoxMembership {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column('uuid', { name: 'box_id' })
    boxId: string;

    @Column('uuid', { name: 'user_id' })
    userId: string; // Relación con auth.users o public.profiles

    @Column('text', { name: 'status', default: 'active' })
    status: string;

    // role? permissions? Revisar si hay más columnas en output
}
