import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) { }

    // POST /boxes/:boxId/invitations
    @Post('boxes/:boxId/invitations')
    create(
        @Param('boxId') boxId: string,
        @Body() createInvitationDto: CreateInvitationDto
    ) {
        // TODO: Validate that req.user is OWNER of boxId (add OwnerGuard later)
        return this.invitationsService.create(boxId, createInvitationDto);
    }

    // GET /boxes/:boxId/invitations
    @Get('boxes/:boxId/invitations')
    findAllByBox(@Param('boxId') boxId: string) {
        return this.invitationsService.findAllByBox(boxId);
    }

    // DELETE /invitations/:id
    @Delete('invitations/:id')
    remove(@Param('id') id: string) {
        return this.invitationsService.remove(id);
    }

    // POST /invitations/:id/accept
    @Post('invitations/:id/accept')
    accept(@Param('id') id: string, @Request() req) {
        // req.user.userId comes from JwtStrategy
        return this.invitationsService.accept(id, req.user.userId);
    }

    // GET /invitations/my-pending (For future notification panel)
    @Get('invitations/my-pending')
    getMyPending(@Request() req) {
        return this.invitationsService.findPendingByEmail(req.user.email);
    }

    // POST /invitations/:id/reject (For future notification panel)
    @Post('invitations/:id/reject')
    reject(@Param('id') id: string, @Request() req) {
        return this.invitationsService.reject(id, req.user.userId);
    }

    // DEPRECATED: Will be removed in future version
    // Use email link flow instead
    @Post('invitations/accept-mine')
    acceptMine(@Request() req) {
        return this.invitationsService.acceptPendingInvitations(req.user.userId, req.user.email);
    }
}
