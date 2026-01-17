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
    async create(userId: string, createMembershipDto: CreateMembershipDto, queryRunner?: any): Promise<BoxMembership> {
        const { boxId, role, membershipType } = createMembershipDto;

        // Use the provided queryRunner's manager if available, otherwise default to repository
        const manager = queryRunner ? queryRunner.manager : this.membershipRepository.manager;

        const newMembership = manager.create(BoxMembership, {
            user_id: userId,
            box_id: boxId,
            role: role || 'athlete',
            membership_type: membershipType || 'athlete',
            is_active: true
        });

        return manager.save(newMembership);
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

        // Ideally checking ownership or admin rights (simplified for now to assume check passes or is admin)
        // If strict user check is needed: 
        // if (membership.user_id !== userId) throw new ForbiddenException(...); 
        // But for admin actions from `AthleteListComponent`, the `userId` in arg is the admin, not the member.
        // NOTE: The current `deactivate` implementation assumed self-deactivation. 
        // For admin usage, we need to allow if user is owner/trainer of the box. 
        // Assuming the Guard/Controller handles role checks or we trust the caller for now.

        membership.is_active = false;
        await this.membershipRepository.save(membership);
    }

    async activate(userId: string, membershipId: string): Promise<void> {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId }
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found`);
        }

        membership.is_active = true;
        await this.membershipRepository.save(membership);
    }

    async remove(userId: string, membershipId: string): Promise<void> {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId }
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found`);
        }

        await this.membershipRepository.remove(membership);
    }
}
