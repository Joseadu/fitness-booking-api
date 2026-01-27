import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BoxMembership } from '../../memberships/entities/box-membership.entity';
import { Expose } from 'class-transformer';

@Entity('profiles')
export class Profile {
    @PrimaryColumn('uuid')
    id: string;

    @Column('text', { name: 'full_name', nullable: true })
    @Expose({ name: 'full_name' })
    fullName: string;

    @Column('text', { name: 'avatar_url', nullable: true })
    @Expose({ name: 'avatar_url' })
    avatarUrl: string;

    @Column('text', { nullable: true })
    phone: string;

    @Column('text', { name: 'emergency_contact', nullable: true })
    @Expose({ name: 'emergency_contact' })
    emergencyContact: string;

    @Column('date', { name: 'birth_date', nullable: true })
    @Expose({ name: 'birth_date' })
    birthDate: Date;

    @CreateDateColumn({ name: 'joined_at' })
    @Expose({ name: 'joined_at' })
    joinedAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    @Expose({ name: 'updated_at' })
    updatedAt: Date;

    @Column('uuid', { name: 'active_box_id', nullable: true })
    @Expose({ name: 'active_box_id' })
    activeBoxId: string;

    @OneToMany(() => BoxMembership, (membership) => membership.profile)
    memberships: BoxMembership[];
}
