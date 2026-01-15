import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Box } from '../../boxes/entities/box.entity';
import { Profile } from '../../users/entities/profile.entity';

export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

@Entity('box_invitations')
export class Invitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('uuid', { name: 'box_id' })
    box_id: string;

    @ManyToOne(() => Box)
    @JoinColumn({ name: 'box_id' })
    box: Box;

    @Column('text')
    email: string;

    // Optional: Link to user if they already exist (Path B) or after creation (Path A)
    @Column('uuid', { name: 'user_id', nullable: true })
    user_id: string | null;

    @ManyToOne(() => Profile)
    @JoinColumn({ name: 'user_id' })
    profile: Profile;

    @Column('text', { default: InvitationStatus.PENDING })
    status: InvitationStatus;

    @Column({ type: 'uuid', nullable: true, unique: true })
    token: string | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updated_at: Date;
}
