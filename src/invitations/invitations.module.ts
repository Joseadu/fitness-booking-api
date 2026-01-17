import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { Invitation } from './entities/invitation.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';
import { Box } from '../boxes/entities/box.entity';
import { ConfigModule } from '@nestjs/config';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Invitation, Profile, BoxMembership, Box]),
        ConfigModule,
        MembershipsModule,
    ],
    controllers: [InvitationsController],
    providers: [InvitationsService],
    exports: [InvitationsService],
})
export class InvitationsModule { }
