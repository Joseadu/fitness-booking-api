import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('memberships')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipsController {
    constructor(private readonly membershipsService: MembershipsService) { }

    @Get('my-memberships')
    async getUserMemberships(@CurrentUser() user) {
        // Retrieves real memberships from the database
        return this.membershipsService.findAllByUser(user.userId);
    }

    @Get('box/:boxId')
    async findOne(@CurrentUser() user, @Param('boxId') boxId: string) {
        return this.membershipsService.checkMembership(user.userId, boxId);
    }

    @Post()
    async create(@CurrentUser() user, @Body() createMembershipDto: CreateMembershipDto) {
        return this.membershipsService.create(user.userId, createMembershipDto);
    }

    @Patch(':id')
    @Roles(UserRole.OWNER)
    async update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user) {
        return this.membershipsService.update(id, dto, user);
    }

    @Patch(':id/deactivate')
    @Roles(UserRole.OWNER)
    async deactivate(@CurrentUser() user, @Param('id') id: string) {
        return this.membershipsService.deactivate(user.userId, id, user);
    }

    @Patch(':id/activate')
    @Roles(UserRole.OWNER)
    async activate(@CurrentUser() user, @Param('id') id: string) {
        return this.membershipsService.activate(user.userId, id, user);
    }

    @Delete(':id')
    @Roles(UserRole.OWNER)
    async remove(@CurrentUser() user, @Param('id') id: string) {
        return this.membershipsService.remove(user.userId, id, user);
    }
}
