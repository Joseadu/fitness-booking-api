import { Controller, Get, Body, Put, Delete, Param, Query, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { AthleteService } from './athlete.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/dtos/pagination.dto';

@Controller('athletes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AthleteController {
    constructor(private readonly athleteService: AthleteService) { }

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


}
