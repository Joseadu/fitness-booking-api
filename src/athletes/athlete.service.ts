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

        // Raw Query to join with auth.users (which TypeORM can't map easily across schemas)
        const query = `
            SELECT 
                bm.id,
                bm.role,
                bm.is_active,
                bm.joined_at,
                p.full_name,
                p.avatar_url,
                u.email
            FROM box_memberships bm
            LEFT JOIN profiles p ON p.id = bm.user_id
            LEFT JOIN auth.users u ON u.id = bm.user_id
            WHERE bm.box_id = $1
            ORDER BY bm.joined_at DESC
            LIMIT $2 OFFSET $3
        `;

        const countQuery = `
            SELECT COUNT(*) as count 
            FROM box_memberships 
            WHERE box_id = $1
        `;

        const [items, countResult] = await Promise.all([
            this.profileRepository.query(query, [boxId, limit, skip]),
            this.profileRepository.query(countQuery, [boxId])
        ]);

        const totalItems = parseInt(countResult[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        const mappedItems = items.map(m => ({
            id: m.id,
            full_name: m.full_name,
            avatar_url: m.avatar_url,
            email: m.email, // Added email
            role: m.role,
            is_active: m.is_active,
            joined_at: m.joined_at
        }));

        return {
            items: mappedItems,
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
