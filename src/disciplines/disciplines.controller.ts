import { Controller, Get, Post, Body, Put, Patch, Param, Query, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { DisciplinesService } from './disciplines.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BaseController } from '../common/controllers/base.controller';
import { Discipline } from './entities/discipline.entity';

@Controller('disciplines')
@UseGuards(JwtAuthGuard, RolesGuard) // Proteger todos los endpoints
export class DisciplinesController extends BaseController<Discipline> {
    constructor(private readonly disciplinesService: DisciplinesService) {
        super(disciplinesService);
    }

    @Post()
    @Roles('business_owner')
    @UsePipes(new ValidationPipe())
    create(@Body() createDisciplineDto: CreateDisciplineDto, @CurrentUser() user) {
        // TODO: Validate ownership via service (Phase 5.5 extension if needed, or rely on Box Owner role)
        return this.disciplinesService.create(createDisciplineDto);
    }

    @Get()
    findAll(@Query() paginationDto: PaginationDto, @Query('boxId') boxId?: string) {
        return this.disciplinesService.findAll(paginationDto, { boxId });
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

    // remove inherited from BaseController (allows admin + business_owner)

    @Patch(':id/activate')
    @Roles('business_owner')
    activate(@Param('id') id: string) {
        return this.disciplinesService.update(id, { isActive: true });
    }

    @Patch(':id/deactivate')
    @Roles('business_owner')
    deactivate(@Param('id') id: string) {
        return this.disciplinesService.update(id, { isActive: false });
    }
}
