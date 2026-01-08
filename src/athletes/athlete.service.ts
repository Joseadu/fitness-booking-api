import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../users/entities/profile.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AthleteService {
    constructor(
        @InjectRepository(Profile)
        private profileRepository: Repository<Profile>,
    ) { }

    async findOne(id: string): Promise<Profile> {
        const profile = await this.profileRepository.findOne({
            where: { id },
            // Cargamos membresías. Nota: Si la entidad BoxMembership evoluciona a tener relation a Box, añadir 'memberships.box'
            relations: ['memberships'],
        });
        // Si no existe perfil, throw.
        if (!profile) {
            throw new NotFoundException(`Profile with ID "${id}" not found`);
        }
        return profile;
    }

    async update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
        await this.findOne(id); // Check existence
        await this.profileRepository.update(id, updateProfileDto);
        return this.findOne(id); // Return updated
    }
    async findAllByBox(boxId: string): Promise<Profile[]> {
        const memberships = await this.profileRepository.manager
            .getRepository(BoxMembership)
            .find({
                where: { boxId },
                relations: ['profile'],
            });

        return memberships.map(m => m.profile);
    }

    async removeMembership(userId: string, boxId: string): Promise<void> {
        const membership = await this.profileRepository.manager
            .getRepository(BoxMembership)
            .findOne({ where: { userId, boxId } });

        if (!membership) {
            throw new NotFoundException(`Membership not found for user ${userId} in box ${boxId}`);
        }

        await this.profileRepository.manager
            .getRepository(BoxMembership)
            .remove(membership);
    }
}
