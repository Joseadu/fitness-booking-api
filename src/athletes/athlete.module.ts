import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { BoxMembership } from './entities/box-membership.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Profile, BoxMembership])],
    exports: [TypeOrmModule],
})
export class AthleteModule { }
