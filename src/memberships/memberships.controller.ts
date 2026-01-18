import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
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
    @Roles('business_owner')
    async deactivate(@Request() req, @Param('id') id: string) {
        return this.membershipsService.deactivate(req.user.userId, id);
    }

    @Patch(':id/activate')
    @Roles('business_owner')
    async activate(@Request() req, @Param('id') id: string) {
        return this.membershipsService.activate(req.user.userId, id);
    }

    @Delete(':id')
    @Roles('business_owner')
    async remove(@Request() req, @Param('id') id: string) {
        return this.membershipsService.remove(req.user.userId, id);
    }
}
