import { Controller, Get, Post, Body, Query, UseGuards, Request, Delete, Param, Put } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulesController {
    constructor(private readonly schedulesService: SchedulesService) { }



    @Get()
    findAll(
        @Query('boxId') boxId: string,
        @Query('fromDate') fromDate: string,
        @Query('toDate') toDate: string,
        @Query('includeDrafts') includeDrafts: string,
        @CurrentUser() user
    ) {
        // Validar boxId
        const includeDraftsBool = includeDrafts === 'true';
        return this.schedulesService.findAllByBox(boxId, user.userId, fromDate, toDate, includeDraftsBool);
    }

    // UN SOLO ENDPOINT PARA TODO
    @Post('delete')
    @Roles('business_owner')
    delete(@Body() body: { ids: string[] }, @CurrentUser() user) {
        return this.schedulesService.delete(body.ids, user);
    }

    @Post()
    @Roles('business_owner')
    create(@Body() body: CreateScheduleDto | CreateScheduleDto[], @CurrentUser() user) {
        // Normalización: Si es objeto único, convertir a array
        const schedules = Array.isArray(body) ? body : [body];
        return this.schedulesService.create(schedules, user);
    }

    @Post('copy-week')
    @Roles('business_owner')
    copyWeek(@Body() body: { boxId: string, fromDate: string, toDate: string }, @CurrentUser() user) {
        return this.schedulesService.copyWeek(body.boxId, body.fromDate, body.toDate, user);
    }



    // GET ONE (Para editar)
    @Get(':id')
    findOne(@Param('id') id: string) {
        // FindOne es público (o para autenticados), no requiere ownership estricto para VER, 
        // pero sí si quisiéramos ocultar drafts. Por ahora el service lo maneja.
        return this.schedulesService.findOne(id);
    }

    // UPDATE (Para guardar cambios. También para publicar una clase o muchas seleccionadas de una programación)
    @Put(':id')
    @Roles('business_owner')
    update(@Param('id') id: string, @Body() updateDto: any, @CurrentUser() user) {
        return this.schedulesService.update(id, updateDto, user);
    }

    // CANCEL (Lógica de negocio)
    @Post('cancel')
    @Roles('business_owner') // Solo owners cancelan, o entrenadores? Asumimos owners por ahora
    cancel(@Body() body: { ids: string[], reason: string }, @CurrentUser() user) {
        return this.schedulesService.cancel(body.ids, body.reason, user);
    }

    // REACTIVATE (Lógica de negocio)
    @Post('reactivate')
    @Roles('business_owner')
    reactivate(@Body() body: { ids: string[] }, @CurrentUser() user) {
        return this.schedulesService.reactivate(body.ids, user);
    }

    // PUBLISH WEEK (publicar una semana)
    @Post('publish-week')
    @Roles('business_owner')
    publishWeek(@Body() body: { boxId: string, weekStart: string }, @CurrentUser() user) {
        return this.schedulesService.publishWeek(body.boxId, body.weekStart, user);
    }

    // POST /schedules/:id/booking (FALTA ESTE)

}
