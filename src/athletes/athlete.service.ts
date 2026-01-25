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
    async findAllByBox(boxId: string, paginationDto: PaginationDto, status: string = 'all'): Promise<PaginatedResult<any>> {
        try {
            const { page = 1, limit = 10 } = paginationDto;
            const safeLimit = Math.max(1, Number(limit));
            const safePage = Math.max(1, Number(page));
            const offset = (safePage - 1) * safeLimit;

            // Members Query - profiles table does NOT have email column
            let membersQuery = `
            SELECT 
                bm.id as id,
                p.full_name as full_name,
                p.avatar_url as avatar_url,
                bm.role as role,
                CASE WHEN bm.is_active THEN 'active' ELSE 'inactive' END as status,
                bm.joined_at as joined_at,
                'member' as type
            FROM box_memberships bm
            JOIN profiles p ON bm.user_id = p.id
            WHERE bm.box_id = '${boxId}' 
            `;

            if (status === 'active') membersQuery += ` AND bm.is_active = true`;
            if (status === 'inactive') membersQuery += ` AND bm.is_active = false`;
            if (status === 'pending') membersQuery += ` AND 1=0`;

            // Invitations Query
            let invitationsQuery = `
            SELECT 
                i.id as id,
                i.email as full_name,
                CAST(NULL as text) as avatar_url, 
                'athlete' as role,
                'pending' as status,
                i.created_at as joined_at,
                'invitation' as type
            FROM box_invitations i
            WHERE i.box_id = '${boxId}' AND i.status = 'pending'
            `;

            if (status === 'active' || status === 'inactive') invitationsQuery += ` AND 1=0`;

            const unifiedQuery = `
            SELECT * FROM (
                ${membersQuery}
                UNION ALL
                ${invitationsQuery}
            ) as combined
            ORDER BY 
                CASE WHEN status = 'pending' THEN 1 ELSE 2 END,
                joined_at DESC
            LIMIT ${safeLimit} OFFSET ${offset}
            `;

            const countQuery = `
            SELECT COUNT(*) as total FROM (
                ${membersQuery}
                UNION ALL
                ${invitationsQuery}
            ) as combined
            `;

            const [items, countResult] = await Promise.all([
                this.profileRepository.query(unifiedQuery),
                this.profileRepository.query(countQuery)
            ]);

            const totalItems = parseInt(countResult[0].total, 10);
            const totalPages = Math.ceil(totalItems / safeLimit);

            return {
                items,
                meta: {
                    totalItems,
                    itemCount: items.length,
                    itemsPerPage: safeLimit,
                    totalPages,
                    currentPage: safePage
                }
            };
        } catch (error) {
            console.error('Error in findAllByBox:', error);
            throw error;
        }
    }


}
