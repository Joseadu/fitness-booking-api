import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoxMembership } from './entities/box-membership.entity';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BoxMembership]),
        NotificationsModule
    ],
    controllers: [MembershipsController],
    providers: [MembershipsService],
    exports: [TypeOrmModule, MembershipsService],
})
export class MembershipsModule { }
