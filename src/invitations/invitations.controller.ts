import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) { }

    // POST /boxes/:boxId/invitations
    @Post('boxes/:boxId/invitations')
    @Roles('business_owner')
    create(
        @Param('boxId') boxId: string,
        @Body() createInvitationDto: CreateInvitationDto,
        @CurrentUser() user
    ) {
        return this.invitationsService.create(boxId, createInvitationDto, user);
    }

    // GET /boxes/:boxId/invitations
    @Get('boxes/:boxId/invitations')
    @Roles('business_owner')
    findAllByBox(@Param('boxId') boxId: string, @CurrentUser() user) {
        return this.invitationsService.findAllByBox(boxId, user);
    }

    // DELETE /invitations/:id
    @Delete('invitations/:id')
    @Roles('business_owner')
    remove(@Param('id') id: string, @CurrentUser() user) {
        return this.invitationsService.remove(id, user);
    }

    // POST /invitations/:id/accept
    @Post('invitations/:id/accept')
    accept(@Param('id') id: string, @CurrentUser() user) {
        // req.user.userId comes from JwtStrategy
        return this.invitationsService.accept(id, user.userId);
    }

    // GET /invitations/my-pending (For future notification panel)
    @Get('invitations/my-pending')
    getMyPending(@CurrentUser() user) {
        return this.invitationsService.findPendingByEmail(user.email);
    }

    // POST /invitations/:id/reject (For future notification panel)
    @Post('invitations/:id/reject')
    reject(@Param('id') id: string, @CurrentUser() user) {
        return this.invitationsService.reject(id, user.userId);
    }

    // DEPRECATED: Will be removed in future version
    // Use email link flow instead
    @Post('invitations/accept-mine')
    acceptMine(@CurrentUser() user) {
        return this.invitationsService.acceptPendingInvitations(user.userId, user.email);
    }
    // Public endpoint to validate setup token
    @Public()
    @Get('invitations/validate-token/:token')
    validateToken(@Param('token') token: string) {
        return this.invitationsService.validateToken(token);
    }

    // Public endpoint to complete setup (set password + accept invite)
    @Public()
    @Post('invitations/setup-account')
    setupAccount(@Body() body: { token: string; password: string }) {
        return this.invitationsService.setupAccount(body.token, body.password);
    }
}
