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
    async deactivate(userId: string, membershipId: string, user: any): Promise<void> {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId }
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found`);
        }

        // Verify that the acting user (user) owns the box of the membership
        this.verifyOwnership(membership.box_id, user);

        membership.is_active = false;
        await this.membershipRepository.save(membership);
    }

    async activate(userId: string, membershipId: string, user: any): Promise<void> {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId }
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found`);
        }

        this.verifyOwnership(membership.box_id, user);

        membership.is_active = true;
        await this.membershipRepository.save(membership);
    }

    async remove(userId: string, membershipId: string, user: any): Promise<void> {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId }
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found`);
        }

        this.verifyOwnership(membership.box_id, user);

        await this.membershipRepository.remove(membership);
    }
    private verifyOwnership(boxId: string, user: any) {
        if (!user || !user.memberships) {
            throw new ForbiddenException('No membership context found');
        }

        const hasPermission = user.roles.includes('admin') || user.memberships.some((m: any) =>
            m.boxId === boxId && ['business_owner'].includes(m.role)
        );

        if (!hasPermission) {
            throw new ForbiddenException(`You do not have permission to manage members for Box ${boxId}`);
        }
    }

    /**
     * Activate membership by ID (simplified version for athletes controller)
     */
    async activateMembership(membershipId: string): Promise<BoxMembership> {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId }
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found`);
        }

        membership.is_active = true;
        return this.membershipRepository.save(membership);
    }

    /**
     * Deactivate membership by ID (simplified version for athletes controller)
     */
    async deactivateMembership(membershipId: string): Promise<BoxMembership> {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId }
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found`);
        }

        membership.is_active = false;
        return this.membershipRepository.save(membership);
    }

    /**
     * Delete membership by ID (simplified version for athletes controller)
     */
    async deleteMembership(membershipId: string): Promise<void> {
        const membership = await this.membershipRepository.findOne({
            where: { id: membershipId }
        });

        if (!membership) {
            throw new NotFoundException(`Membership not found`);
        }

        await this.membershipRepository.remove(membership);
    }
}
