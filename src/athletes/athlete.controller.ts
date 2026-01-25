import { Controller, Get, Body, Put, Patch, Delete, Param, Query, UseGuards, Request, UsePipes, ValidationPipe, Inject } from '@nestjs/common';
import { AthleteService } from './athlete.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
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

    // ==========================================
    // 🏋️ GYM MANAGEMENT (Owners/Trainers)
    // ==========================================

    @Get()
    @Roles('business_owner', 'coach')
    findAllByBox(@Query('boxId') boxId: string, @Query() paginationDto: PaginationDto) {
        return this.athleteService.findAllByBox(boxId, paginationDto);
    }

    // findOne removed (Moved to ProfilesController)

    @Patch(':id/activate')
    @Roles('business_owner', 'coach')
    activate(@Param('id') id: string) {
        return this.membershipService.activateMembership(id);
    }

    @Patch(':id/deactivate')
    @Roles('business_owner', 'coach')
    deactivate(@Param('id') id: string) {
        return this.membershipService.deactivateMembership(id);
    }

    @Delete(':id')
    @Roles('business_owner')
    remove(@Param('id') id: string) {
        return this.membershipService.deleteMembership(id);
    }
}
