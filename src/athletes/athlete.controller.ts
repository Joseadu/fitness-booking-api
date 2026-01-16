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

    @Get('me')
    getProfile(@Request() req) {
        // El userId viene del JWT Strategy (via JwtAuthGuard)
        return this.athleteService.findOne(req.user.userId);
    }

    @Put('me')
    @UsePipes(new ValidationPipe())
    updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        return this.athleteService.update(req.user.userId, updateProfileDto);
    }

    // ==========================================
    // 🏋️ GYM MANAGEMENT (Owners/Trainers)
    // ==========================================

    @Get()
    // Recomendable: @Roles(UserRole.BUSINESS_OWNER, UserRole.TRAINER)
    findAllByBox(@Query('boxId') boxId: string) {
        return this.athleteService.findAllByBox(boxId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.athleteService.findOne(id);
    }


}
