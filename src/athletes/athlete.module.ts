import { Module } from '@nestjs/common';
import { AthleteService } from './athlete.service';
import { AthleteController } from './athlete.controller';
import { UsersModule } from '../users/users.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
    imports: [UsersModule, MembershipsModule],
    controllers: [AthleteController],
    providers: [AthleteService],
    exports: [AthleteService],
})
export class AthleteModule { }
