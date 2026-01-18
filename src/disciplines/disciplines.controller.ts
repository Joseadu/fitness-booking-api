import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { DisciplinesService } from './disciplines.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('disciplines')
@UseGuards(JwtAuthGuard, RolesGuard) // Proteger todos los endpoints
export class DisciplinesController {
    constructor(private readonly disciplinesService: DisciplinesService) { }

    @Post()
    @Roles('business_owner')
    @UsePipes(new ValidationPipe())
    create(@Body() createDisciplineDto: CreateDisciplineDto, @CurrentUser() user) {
        // TODO: Validate ownership via service (Phase 5.5 extension if needed, or rely on Box Owner role)
        return this.disciplinesService.create(createDisciplineDto);
    }

    @Get()
    findAll(@Query('boxId') boxId?: string) {
        return this.disciplinesService.findAll(boxId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.disciplinesService.findOne(id);
    }

    @Put(':id')
    @Roles('business_owner')
    @UsePipes(new ValidationPipe())
    update(@Param('id') id: string, @Body() updateDisciplineDto: UpdateDisciplineDto) {
        return this.disciplinesService.update(id, updateDisciplineDto);
    }

    @Delete(':id')
    @Roles('business_owner')
    remove(@Param('id') id: string) {
        return this.disciplinesService.remove(id);
    }
}
