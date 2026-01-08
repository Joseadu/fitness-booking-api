import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Profile } from '../../users/entities/profile.entity';
import { Box } from '../../boxes/entities/box.entity';

@Entity('box_memberships')
export class BoxMembership {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'box_id' })
    boxId: string;

    @ManyToOne(() => Box)
    @JoinColumn({ name: 'box_id' })
    box: Box;

    @Column('uuid', { name: 'user_id' })
    userId: string;

    @ManyToOne(() => Profile, (profile) => profile.memberships)
    @JoinColumn({ name: 'user_id' })
    profile: Profile;

    @Column('text', { default: 'athlete' })
    role: string;

    @Column('text', { name: 'membership_type', nullable: true, default: 'athlete' })
    membershipType: string;

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;

    @Column('timestamptz', { name: 'joined_at', default: () => 'CURRENT_TIMESTAMP' })
    joinedAt: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
