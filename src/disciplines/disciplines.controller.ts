import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { DisciplinesService } from './disciplines.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('disciplines')
@UseGuards(JwtAuthGuard) // Proteger todos los endpoints
export class DisciplinesController {
    constructor(private readonly disciplinesService: DisciplinesService) { }

    @Post()
    @UsePipes(new ValidationPipe())
    create(@Body() createDisciplineDto: CreateDisciplineDto) {
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
    @UsePipes(new ValidationPipe())
    update(@Param('id') id: string, @Body() updateDisciplineDto: UpdateDisciplineDto) {
        return this.disciplinesService.update(id, updateDisciplineDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.disciplinesService.remove(id);
    }
}
