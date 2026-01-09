import { Controller, Get, Post, Body, Query, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
    constructor(private readonly schedulesService: SchedulesService) { }

    @Get('my-bookings')
    findMyBookings(@Request() req) {
        return this.schedulesService.findMyBookings(req.user.userId);
    }

    @Get()
    findAll(
        @Query('boxId') boxId: string,
        @Query('fromDate') fromDate: string,
        @Query('toDate') toDate: string,
        @Request() req
    ) {
        // Validar boxId
        return this.schedulesService.findAllByBox(boxId, req.user.userId, fromDate, toDate);
    }

    // UN SOLO ENDPOINT PARA TODO
    @Post('delete')
    delete(@Body() body: { ids: string[] }) {
        return this.schedulesService.delete(body.ids);
    }

    @Post()
    // @Roles('OWNER') -> Futuro
    create(@Body() body: CreateScheduleDto | CreateScheduleDto[]) {
        // Normalización: Si es objeto único, convertir a array
        const schedules = Array.isArray(body) ? body : [body];
        return this.schedulesService.create(schedules);
    }

    @Post('copy-week')
    copyWeek(@Body() body: { boxId: string, fromDate: string, toDate: string }) {
        return this.schedulesService.copyWeek(body.boxId, body.fromDate, body.toDate);
    }

    @Delete(':id/booking')
    unsubscribe(@Param('id') scheduleId: string, @Request() req) {
        return this.schedulesService.unsubscribe(scheduleId, req.user.userId);
    }
}
