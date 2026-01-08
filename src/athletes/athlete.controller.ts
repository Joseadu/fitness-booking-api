import { Controller, Get, Body, Put, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { AthleteService } from './athlete.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('athletes')
@UseGuards(JwtAuthGuard)
export class AthleteController {
    constructor(private readonly athleteService: AthleteService) { }

    @Get('me')
    getProfile(@Request() req) {
        // El userId viene del JWT Strategy (payload.sub)
        return this.athleteService.findOne(req.user.userId);
    }

    @Put('me')
    @UsePipes(new ValidationPipe())
    updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        return this.athleteService.update(req.user.userId, updateProfileDto);
    }
}
