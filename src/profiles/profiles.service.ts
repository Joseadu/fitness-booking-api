import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from '../athletes/dto/update-profile.dto';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectRepository(Profile)
        private profileRepository: Repository<Profile>,
    ) { }

    async findOne(id: string): Promise<Profile> {
        const profile = await this.profileRepository.findOne({
            where: { id },
            relations: ['memberships', 'memberships.box'],
        });

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
}
