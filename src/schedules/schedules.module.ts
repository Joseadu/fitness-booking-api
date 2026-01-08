import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from './entities/schedule.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Schedule])],
    controllers: [SchedulesController],
    providers: [SchedulesService],
    exports: [SchedulesService], // Exportamos por si otros módulos necesitan consultar horarios
})
export class SchedulesModule { }
