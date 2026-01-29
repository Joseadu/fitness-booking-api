import { Controller, Get, Body, Put, Patch, Delete, Param, Query, UseGuards, Request, UsePipes, ValidationPipe, Inject } from '@nestjs/common';
import { AthleteService } from './athlete.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/role.enum';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { MembershipsService } from '../memberships/memberships.service';

@Controller('athletes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AthleteController {
    constructor(
        private readonly athleteService: AthleteService,
        private readonly membershipService: MembershipsService
    ) { }

    // ==========================================
    // 👤 USER SELF-MANAGEMENT
    // ==========================================

    // getMe removed (Moved to ProfilesController)

    // updateProfile removed (Moved to ProfilesController)

    @Patch(':id')
    @Roles(UserRole.OWNER)
    update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user) {
        return this.membershipService.update(id, dto, user);
    }

    @Get(':id')
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    async findOne(@Param('id') id: string) {
        const membership = await this.membershipService.findOne(id);
        return {
            id: membership.id,
            user_id: membership.user_id,
            full_name: membership.profile?.fullName,
            avatar_url: membership.profile?.avatarUrl,
            phone: membership.profile?.phone,
            emergency_contact: membership.profile?.emergencyContact,
            birth_date: membership.profile?.birthDate,
            joined_at: membership.joined_at,
            role: membership.role,
            is_active: membership.is_active
        };
    }

    @Get()
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    findAllByBox(
        @Query('boxId') boxId: string,
        @Query('role') role: string,
        @Query('status') status: string,
        @Query() paginationDto: PaginationDto
    ) {
        return this.athleteService.findAllByBox(boxId, paginationDto, role, status);
    }

    // findOne removed (Moved to ProfilesController)

    @Patch(':id/activate')
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    activate(@Param('id') id: string) {
        return this.membershipService.activateMembership(id);
    }

    @Patch(':id/deactivate')
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    deactivate(@Param('id') id: string) {
        return this.membershipService.deactivateMembership(id);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER)
    remove(@Param('id') id: string) {
        return this.membershipService.deleteMembership(id);
    }
}
