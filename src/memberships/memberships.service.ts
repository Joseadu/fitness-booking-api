import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoxMembership } from './entities/box-membership.entity';
import { CreateMembershipDto } from './dto/create-membership.dto';


@Injectable()
export class MembershipsService {
    constructor(
        @InjectRepository(BoxMembership)
        private readonly membershipRepository: Repository<BoxMembership>,
    ) { }

    /**
     * Get all memberships for a specific user
     */
    async findAllByUser(userId: string): Promise<BoxMembership[]> {
        return this.membershipRepository.find({
            where: { user_id: userId },
            relations: ['box'],
        });
    }

    /**
     * Find specific membership
     */
    async checkMembership(userId: string, boxId: string): Promise<BoxMembership> {
        const membership = await this.membershipRepository.findOne({
            where: {
                user_id: userId,
                box_id: boxId
            },
            relations: ['box']
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found for box ${boxId}`);
        }

        return membership;
    }

    /**
     * Create a new membership
     */
    async create(userId: string, createMembershipDto: CreateMembershipDto): Promise<BoxMembership> {
        const { boxId, role, membershipType } = createMembershipDto;

        const newMembership = this.membershipRepository.create({
            user_id: userId,
            box_id: boxId,
            role: role || 'athlete',
            membership_type: membershipType || 'athlete',
            is_active: true
        });

        return this.membershipRepository.save(newMembership);
    }

    /**
     * Deactivate a membership
     */
    async deactivate(userId: string, membershipId: string): Promise<void> {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId }
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found`);
        }

        // Ensure the user owns this membership or has admin rights (logic can be expanded)
        if (membership.user_id !== userId) {
            throw new ForbiddenException('You can only deactivate your own memberships');
        }

        membership.is_active = false;
        await this.membershipRepository.save(membership);
    }
}
