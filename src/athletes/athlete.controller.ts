import { Controller, Get, Body, Put, Delete, Param, Query, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { AthleteService } from './athlete.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('athletes')
@UseGuards(JwtAuthGuard)
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
    // Recomendable: @Roles(UserRole.BUSINESS_OWNER, UserRole.TRAINER)
    findAllByBox(@Query('boxId') boxId: string) {
        return this.athleteService.findAllByBox(boxId);
    }

    // findOne removed (Moved to ProfilesController)


}
