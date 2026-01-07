import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('profiles')
export class Profile {
    @PrimaryColumn('uuid')
    id: string;

    @Column('text', { nullable: true })
    username: string;

    @Column('text', { name: 'full_name', nullable: true })
    fullName: string;

    @Column('text', { name: 'avatar_url', nullable: true })
    avatarUrl: string;

    @Column('text', { nullable: true })
    website: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column('uuid', { name: 'active_box_id', nullable: true })
    activeBoxId: string;
}
