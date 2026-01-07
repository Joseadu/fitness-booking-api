import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discipline } from './entities/discipline.entity';
import { DisciplinesController } from './disciplines.controller';
import { DisciplinesService } from './disciplines.service';

@Module({
    imports: [TypeOrmModule.forFeature([Discipline])],
    controllers: [DisciplinesController],
    providers: [DisciplinesService],
    exports: [TypeOrmModule, DisciplinesService],
})
export class DisciplinesModule { }
