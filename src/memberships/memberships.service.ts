import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoxMembership } from './entities/box-membership.entity';

@Injectable()
export class MembershipsService {
    constructor(
        @InjectRepository(BoxMembership)
        private readonly membershipRepository: Repository<BoxMembership>,
    ) { }

    async findAllByUser(userId: string): Promise<BoxMembership[]> {
        return this.membershipRepository.find({
            where: {
                user_id: userId,
                is_active: true,
            },
            relations: ['box'],
        });
    }

    async findOneByBox(userId: string, boxId: string): Promise<BoxMembership> {
        const membership = await this.membershipRepository.findOne({
            where: {
                user_id: userId,
                box_id: boxId,
                is_active: true,
            },
            relations: ['box'],
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found for box ${boxId}`);
        }

        return membership;
    }
}
