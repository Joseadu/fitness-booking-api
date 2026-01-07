import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeekTemplate } from './entities/week-template.entity';
import { WeekTemplateItem } from './entities/week-template-item.entity';

@Module({
    imports: [TypeOrmModule.forFeature([WeekTemplate, WeekTemplateItem])],
    exports: [TypeOrmModule],
})
export class TemplatesModule { }
