import { Controller, Get, Post, Body, Param, Delete, Put, Patch, Query, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/create-template.dto'; // Validar paths
import { AddTemplateItemDto } from './dto/add-template-item.dto';
import { ImportTemplateDto, ApplyTemplateDto } from './dto/template-actions.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ajustar path auth
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/role.enum';
import { RolesGuard } from '../auth/roles.guard';
import { BaseController } from '../common/controllers/base.controller';
import { WeekTemplate } from './entities/week-template.entity';

@Controller('week-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController extends BaseController<WeekTemplate> {
    constructor(private readonly templatesService: TemplatesService) {
        super(templatesService);
    }

    // --- Template CRUD ---

    @Post()
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    create(@Body() createTemplateDto: CreateTemplateDto) {
        return this.templatesService.create(createTemplateDto);
    }

    @Get()
    findAll(@Query() paginationDto: PaginationDto, @Query('boxId') boxId?: string) {
        return this.templatesService.findAll(paginationDto, { boxId });
    }

    // findOne inherited (uses service.findOne which handles relations)

    @Patch(':id')
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
        return this.templatesService.update(id, updateTemplateDto);
    }

    // remove inherited from BaseController

    @Patch(':id/activate')
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    activate(@Param('id') id: string) {
        return this.templatesService.update(id, { isActive: true });
    }

    @Patch(':id/deactivate')
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    deactivate(@Param('id') id: string) {
        return this.templatesService.update(id, { isActive: false });
    }

    // --- Logic Endpoints ---

    @Post('import-from-week')
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    importFromWeek(@Body() dto: ImportTemplateDto) {
        return this.templatesService.importFromWeek(dto);
    }

    @Post(':id/apply')
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    applyTemplate(@Param('id') id: string, @Body() dto: ApplyTemplateDto) {
        return this.templatesService.applyTemplate(id, dto);
    }

    @Post(':id/check-conflicts')
    checkConflicts(@Param('id') id: string, @Body() dto: ApplyTemplateDto) {
        return this.templatesService.checkConflicts(id, dto);
    }

    // --- Item CRUD (Nested) ---

    @Post(':id/items')
    @Roles(UserRole.OWNER, UserRole.TRAINER)
    addItem(@Param('id') id: string, @Body() dto: AddTemplateItemDto) {
        return this.templatesService.addItem(id, dto);
    }
}

// Separate controller for direct item manipulation if preferred, 
// or keep everything here. User asked for:
// PUT /week-template-items/:itemId
// DELETE /week-template-items/:itemId
// So we can map them here using absolute paths or a separate controller.
// Using absolute paths for simplicity in one file.

@Controller('week-template-items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.TRAINER)
export class TemplateItemsController {
    constructor(private readonly templatesService: TemplatesService) { }

    @Patch(':id')
    updateItem(@Param('id') id: string, @Body() dto: Partial<AddTemplateItemDto>) {
        return this.templatesService.updateItem(id, dto);
    }

    @Delete(':id')
    removeItem(@Param('id') id: string) {
        return this.templatesService.removeItem(id);
    }
}
