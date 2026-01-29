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
    async findAllByBox(boxId: string, paginationDto: PaginationDto, role?: string, status?: string): Promise<PaginatedResult<any>> {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const params: any[] = [boxId, limit, skip];
        let paramIndex = 4;
        let whereClause = `WHERE bm.box_id = $1`;

        if (role) {
            whereClause += ` AND bm.role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        if (status) {
            if (status === 'active') {
                whereClause += ` AND bm.is_active = true`;
            } else if (status === 'inactive') {
                whereClause += ` AND bm.is_active = false`;
            }
        }

        const query = `
            SELECT 
                bm.id,
                bm.user_id,
                bm.role,
                bm.is_active,
                bm.joined_at,
                p.full_name,
                p.avatar_url,
                u.email
            FROM box_memberships bm
            LEFT JOIN profiles p ON p.id = bm.user_id
            LEFT JOIN auth.users u ON u.id = bm.user_id
            ${whereClause}
            ORDER BY bm.joined_at DESC
            LIMIT $2 OFFSET $3
        `;

        // Parameters for count excluding LIMIT and OFFSET
        const countParams = [boxId];
        let countParamIndex = 2;
        let countWhereClause = `WHERE box_id = $1`;

        if (role) {
            countWhereClause += ` AND role = $${countParamIndex}`;
            countParams.push(role);
            countParamIndex++;
        }

        if (status) {
            if (status === 'active') {
                countWhereClause += ` AND is_active = true`;
            } else if (status === 'inactive') {
                countWhereClause += ` AND is_active = false`;
            }
        }

        const countQuery = `
            SELECT COUNT(*) as count 
            FROM box_memberships bm
            ${countWhereClause}
        `;

        const [items, countResult] = await Promise.all([
            this.profileRepository.query(query, params),
            this.profileRepository.query(countQuery, countParams)
        ]);

        const totalItems = parseInt(countResult[0]?.count || '0', 10);
        const totalPages = Math.ceil(totalItems / limit);

        const mappedItems = items.map(m => ({
            id: m.id,
            user_id: m.user_id, // Added user_id
            full_name: m.full_name,
            avatar_url: m.avatar_url,
            email: m.email,
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
