import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('memberships')
@UseGuards(JwtAuthGuard)
export class MembershipsController {
    constructor(private readonly membershipsService: MembershipsService) { }

    @Get('my-memberships')
    async getUserMemberships(@Request() req) {
        // Retrieves real memberships from the database
        return this.membershipsService.findAllByUser(req.user.userId);
    }

    @Get('box/:boxId')
    async findOne(@Request() req, @Param('boxId') boxId: string) {
        return this.membershipsService.checkMembership(req.user.userId, boxId);
    }
}
