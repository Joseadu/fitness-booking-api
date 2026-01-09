import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplatesService } from './templates.service';
import { TemplatesController, TemplateItemsController } from './templates.controller';
import { WeekTemplate } from './entities/week-template.entity';
import { WeekTemplateItem } from './entities/week-template-item.entity';
import { Schedule } from '../schedules/entities/schedule.entity';

@Module({
    imports: [TypeOrmModule.forFeature([WeekTemplate, WeekTemplateItem, Schedule])],
    controllers: [TemplatesController, TemplateItemsController],
    providers: [TemplatesService],
    exports: [TypeOrmModule],
})
export class TemplatesModule { }
