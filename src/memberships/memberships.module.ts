import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoxMembership } from './entities/box-membership.entity';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
    imports: [TypeOrmModule.forFeature([BoxMembership])],
    controllers: [MembershipsController],
    providers: [MembershipsService],
    exports: [TypeOrmModule, MembershipsService],
})
export class MembershipsModule { }
