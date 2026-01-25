import { Controller, Get, Post, Body, Param, Delete, Put, Patch, Query, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/create-template.dto'; // Validar paths
import { AddTemplateItemDto } from './dto/add-template-item.dto';
import { ImportTemplateDto, ApplyTemplateDto } from './dto/template-actions.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Ajustar path auth
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('week-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) { }

    // --- Template CRUD ---

    @Post()
    @Roles('business_owner')
    create(@Body() createTemplateDto: CreateTemplateDto) {
        return this.templatesService.create(createTemplateDto);
    }

    @Get()
    findAll(@Query('boxId') boxId: string, @Query() paginationDto: PaginationDto) {
        return this.templatesService.findAll(boxId, paginationDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.templatesService.findOne(id);
    }

    @Put(':id')
    @Roles('business_owner')
    update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
        return this.templatesService.update(id, updateTemplateDto);
    }

    @Delete(':id')
    @Roles('business_owner')
    remove(@Param('id') id: string) {
        return this.templatesService.remove(id);
    }

    @Patch(':id/activate')
    @Roles('business_owner')
    activate(@Param('id') id: string) {
        return this.templatesService.update(id, { isActive: true });
    }

    @Patch(':id/deactivate')
    @Roles('business_owner')
    deactivate(@Param('id') id: string) {
        return this.templatesService.update(id, { isActive: false });
    }

    // --- Logic Endpoints ---

    @Post('import-from-week')
    @Roles('business_owner')
    importFromWeek(@Body() dto: ImportTemplateDto) {
        return this.templatesService.importFromWeek(dto);
    }

    @Post(':id/apply')
    @Roles('business_owner')
    applyTemplate(@Param('id') id: string, @Body() dto: ApplyTemplateDto) {
        return this.templatesService.applyTemplate(id, dto);
    }

    @Post(':id/check-conflicts')
    checkConflicts(@Param('id') id: string, @Body() dto: ApplyTemplateDto) {
        return this.templatesService.checkConflicts(id, dto);
    }

    // --- Item CRUD (Nested) ---

    @Post(':id/items')
    @Roles('business_owner')
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
@UseGuards(JwtAuthGuard)
export class TemplateItemsController {
    constructor(private readonly templatesService: TemplatesService) { }

    @Put(':id')
    updateItem(@Param('id') id: string, @Body() dto: Partial<AddTemplateItemDto>) {
        return this.templatesService.updateItem(id, dto);
    }

    @Delete(':id')
    removeItem(@Param('id') id: string) {
        return this.templatesService.removeItem(id);
    }
}
