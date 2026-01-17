import { Module } from '@nestjs/common';
import { AthleteService } from './athlete.service';
import { AthleteController } from './athlete.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
    imports: [ProfilesModule, MembershipsModule],
    controllers: [AthleteController],
    providers: [AthleteService],
    exports: [AthleteService],
})
export class AthleteModule { }
