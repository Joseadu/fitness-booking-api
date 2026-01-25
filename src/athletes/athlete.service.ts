import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class AthleteService {
    constructor(
        @InjectRepository(Profile)
        private profileRepository: Repository<Profile>,
    ) { }

    // findOne removed (Moved to ProfilesService)

    // update removed (Moved to ProfilesService)
    async findAllByBox(boxId: string, paginationDto: PaginationDto): Promise<PaginatedResult<any>> {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const [memberships, totalItems] = await this.profileRepository.manager
            .getRepository(BoxMembership)
            .findAndCount({
                where: { box_id: boxId },
                relations: ['profile'],
                skip,
                take: limit,
                order: { joined_at: 'DESC' }
            });

        const items = memberships.map(m => ({
            id: m.id, // membership_id
            full_name: m.profile?.fullName,
            avatar_url: m.profile?.avatarUrl,
            role: m.role,
            is_active: m.is_active ?? true,
            joined_at: m.joined_at
        }));

        const totalPages = Math.ceil(totalItems / limit);

        return {
            items,
            meta: {
                totalItems,
                itemCount: items.length,
                itemsPerPage: limit,
                totalPages,
                currentPage: page
            }
        };
    }


}
