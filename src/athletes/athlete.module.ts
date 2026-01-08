import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { BoxMembership } from './entities/box-membership.entity';
import { AthleteController } from './athlete.controller';
import { AthleteService } from './athlete.service';

@Module({
    imports: [TypeOrmModule.forFeature([Profile, BoxMembership])],
    controllers: [AthleteController],
    providers: [AthleteService],
    exports: [AthleteService],
})
export class AthleteModule { }
