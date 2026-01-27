import { Controller, Get, Put, Body, UseGuards, Request, Param, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from '../athletes/dto/update-profile.dto';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    @Get('me')
    getMe(@Request() req) {
        return this.profilesService.findOne(req.user.userId);
    }

    @Get(':id')
    getProfileById(@Param('id') id: string) {
        return this.profilesService.findOne(id);
    }

    @Put('me')
    updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        return this.profilesService.update(req.user.userId, updateProfileDto);
    }
}
