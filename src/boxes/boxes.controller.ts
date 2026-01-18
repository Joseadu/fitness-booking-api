import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { BoxesService } from './boxes.service';
import { CreateBoxDto } from './dto/create-box.dto';
import { UpdateBoxDto } from './dto/update-box.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('boxes')
@UseInterceptors(ClassSerializerInterceptor)
export class BoxesController {
    constructor(private readonly boxesService: BoxesService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    @Roles('business_owner')
    create(@Body() createBoxDto: CreateBoxDto, @Request() req) {
        // Asumimos que el usuario autenticado es el propietario
        return this.boxesService.create(createBoxDto, req.user.userId);
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
    @Roles('business_owner')
    update(@Param('id') id: string, @Body() updateBoxDto: UpdateBoxDto) {
        return this.boxesService.update(id, updateBoxDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    @Roles('business_owner')
    remove(@Param('id') id: string) {
        return this.boxesService.remove(id);
    }
}
