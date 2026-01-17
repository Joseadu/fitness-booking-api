import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AthleteService {
    constructor(
        @InjectRepository(Profile)
        private profileRepository: Repository<Profile>,
    ) { }

    // findOne removed (Moved to ProfilesService)

    // update removed (Moved to ProfilesService)
    async findAllByBox(boxId: string): Promise<any[]> {
        const memberships = await this.profileRepository.manager
            .getRepository(BoxMembership)
            .find({
                where: { box_id: boxId },
                relations: ['profile'],
            });

        return memberships.map(m => ({
            ...m.profile,
            membership_id: m.id, // Attach membership ID for management
            role: m.role, // Attach role if needed
            is_active: m.is_active ?? true // Fallback to true if null (legacy data fix)
        }));
    }


}
