import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BoxMembership } from '../../memberships/entities/box-membership.entity';

@Entity('profiles')
export class Profile {
    @PrimaryColumn('uuid')
    id: string;

    @Column('text', { name: 'full_name', nullable: true })
    fullName: string;

    @Column('text', { name: 'avatar_url', nullable: true })
    avatarUrl: string;

    @Column('text', { nullable: true })
    phone: string;

    @Column('text', { name: 'emergency_contact', nullable: true })
    emergencyContact: string;

    @Column('date', { name: 'birth_date', nullable: true })
    birthDate: Date;

    @CreateDateColumn({ name: 'joined_at' })
    joinedAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column('uuid', { name: 'active_box_id', nullable: true })
    activeBoxId: string;

    @OneToMany(() => BoxMembership, (membership) => membership.profile)
    memberships: BoxMembership[];
}
