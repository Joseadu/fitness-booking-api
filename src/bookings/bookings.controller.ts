import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
    constructor(private readonly bookingsService: BookingsService) { }

    @Post()
    create(@Body('scheduleId') scheduleId: string, @Request() req) {
        return this.bookingsService.bookClass(scheduleId, req.user.userId);
    }

    @Get('me')
    findMyBookings(@Request() req) {
        return this.bookingsService.findMyBookings(req.user.userId);
    }

    @Delete(':scheduleId')
    remove(@Param('scheduleId') scheduleId: string, @Request() req) {
        return this.bookingsService.unsubscribe(scheduleId, req.user.userId);
    }
}
