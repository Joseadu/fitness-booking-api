import { Controller, Get, Param, Request, UseGuards, Post, Body, Patch } from '@nestjs/common';
import { CreateMembershipDto } from './dto/create-membership.dto';
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

    @Post()
    async create(@Request() req, @Body() createMembershipDto: CreateMembershipDto) {
        return this.membershipsService.create(req.user.userId, createMembershipDto);
    }

    @Patch(':id/deactivate')
    async deactivate(@Request() req, @Param('id') id: string) {
        return this.membershipsService.deactivate(req.user.userId, id);
    }
}
