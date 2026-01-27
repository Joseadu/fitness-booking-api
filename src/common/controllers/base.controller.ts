import { Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BaseService } from '../services/base.service';
import { BaseEntity } from '../entities/base.entity';
import { PaginationDto } from '../dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

// Note: We cannot rely on generics for Body DTOs easily in NestJS decorators without mixins.
// For now, we accept any object and let the Service validate, or subclasses override methods with specific DTOs.
// A better approach in strict NestJS is to override the create/update methods in the subclass controller.

@UseGuards(JwtAuthGuard, RolesGuard)
export abstract class BaseController<T extends BaseEntity> {
    constructor(private readonly service: BaseService<T>) { }

    @Get()
    @Roles('admin', 'business_owner')
    findAll(@Query() paginationDto: PaginationDto) {
        return this.service.findAll(paginationDto);
    }

    @Get(':id')
    @Roles('admin', 'business_owner')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    // Create, Update, Delete are usually specific per resource regarding DTOs and permissions.
    // We can provide them here, but often they are overridden.
    // Let's provide basic implementation that subclasses can expose or override.

    // @Post()
    // create(@Body() createDto: any) {
    //     return this.service.create(createDto);
    // }

    @Delete(':id')
    @Roles('admin', 'business_owner')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
