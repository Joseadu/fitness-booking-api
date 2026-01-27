import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Box } from '../../boxes/entities/box.entity';
import { WeekTemplateItem } from './week-template-item.entity';

@Entity('week_templates')
export class WeekTemplate extends BaseEntity {

    @Column('uuid', { name: 'box_id' })
    boxId: string;

    @ManyToOne(() => Box)
    @JoinColumn({ name: 'box_id' })
    box: Box;

    @Column('text')
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('boolean', { name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => WeekTemplateItem, (item) => item.template)
    items: WeekTemplateItem[];


}
