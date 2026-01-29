import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { BoxesService } from './boxes.service';
import { CreateBoxDto } from './dto/create-box.dto';
import { UpdateBoxDto } from './dto/update-box.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('boxes')
@UseInterceptors(ClassSerializerInterceptor)
export class BoxesController {
    constructor(private readonly boxesService: BoxesService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles(UserRole.OWNER)
    create(@Body() createBoxDto: CreateBoxDto, @CurrentUser() user) {
        // Asumimos que el usuario autenticado es el propietario
        return this.boxesService.create(createBoxDto, user.userId);
    }

    @Get()
    findAll() {
        return this.boxesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.boxesService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    @Roles(UserRole.OWNER)
    update(@Param('id') id: string, @Body() updateBoxDto: UpdateBoxDto, @CurrentUser() user) {
        return this.boxesService.update(id, updateBoxDto, user);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    @Roles(UserRole.OWNER)
    remove(@Param('id') id: string, @CurrentUser() user) {
        return this.boxesService.remove(id, user);
    }
}
