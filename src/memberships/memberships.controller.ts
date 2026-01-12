import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('memberships')
export class MembershipsController {
    constructor(private readonly membershipsService: MembershipsService) { }

    @Get('my-memberships')
    findAll(@Request() req) {
        // userId comes from the JWT payload attached to req.user (e.g. by JwtStrategy)
        // Assuming req.user.id is the profile/user UUID from Supabase
        return this.membershipsService.findAllByUser(req.user.id);
    }

    @Get('box/:boxId')
    findOne(@Request() req, @Param('boxId') boxId: string) {
        return this.membershipsService.findOneByBox(req.user.id, boxId);
    }
}
