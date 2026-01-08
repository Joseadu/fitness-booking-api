import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Profile } from './profile.entity';
import { Box } from '../../boxes/entities/box.entity';

@Entity('box_memberships')
export class BoxMembership {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

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

    @Column('text', { name: 'status', default: 'active' })
    status: string;
}
