import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Patch, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaginationDto } from '../common/dtos/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invitations')
@UseInterceptors(ClassSerializerInterceptor)
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) { }

    // POST /invitations
    @Post()
    @Roles(UserRole.OWNER)
    create(
        @Body() body: CreateInvitationDto & { boxId: string },
        @CurrentUser() user
    ) {
        return this.invitationsService.create(body.boxId, body, user);
    }

    // GET /invitations?boxId=...
    @Get()
    @Roles(UserRole.OWNER)
    findAllByBox(
        @Query('boxId') boxId: string,
        @Query() pagination: PaginationDto,
        @CurrentUser() user
    ) {
        // Adapt service to use pagination if possible, or just return list for now
        // TODO: Update service to return PaginatedResult
        return this.invitationsService.findAllByBox(boxId, user);
    }

    // DELETE /invitations/:id
    @Delete(':id')
    @Roles(UserRole.OWNER)
    remove(@Param('id') id: string, @CurrentUser() user) {
        return this.invitationsService.remove(id, user);
    }

    // POST /invitations/:id/accept
    @Post(':id/accept')
    accept(@Param('id') id: string, @CurrentUser() user) {
        return this.invitationsService.accept(id, user.userId);
    }

    // PATCH /invitations/:id/status (Standardize status update)
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: 'rejected', @CurrentUser() user) {
        if (status === 'rejected') {
            return this.invitationsService.reject(id, user.userId);
        }
    }

    // GET /invitations/my-pending
    @Get('my-pending')
    getMyPending(@CurrentUser() user) {
        return this.invitationsService.findPendingByEmail(user.email);
    }

    // Public endpoint to validate setup token
    @Public()
    @Get('validate-token/:token')
    validateToken(@Param('token') token: string) {
        return this.invitationsService.validateToken(token);
    }

    // Public endpoint to complete setup
    @Public()
    @Post('setup-account')
    setupAccount(@Body() body: { token: string; password: string }) {
        return this.invitationsService.setupAccount(body.token, body.password);
    }

    // --- Backward Compatibility (DEPRECATED) ---
    // POST /invitations/accept-mine
    @Post('accept-mine')
    acceptMine(@CurrentUser() user) {
        return this.invitationsService.acceptPendingInvitations(user.userId, user.email);
    }
}
