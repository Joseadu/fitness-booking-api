import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoxMembership } from './entities/box-membership.entity';

@Module({
    imports: [TypeOrmModule.forFeature([BoxMembership])],
    exports: [TypeOrmModule],
})
export class MembershipsModule { }
