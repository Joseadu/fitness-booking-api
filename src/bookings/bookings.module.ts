import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Schedule } from '../schedules/entities/schedule.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Booking, Schedule, BoxMembership])],
    controllers: [BookingsController],
    providers: [BookingsService],
    exports: [TypeOrmModule, BookingsService], // Export service if needed elsewhere
})
export class BookingsModule { }
