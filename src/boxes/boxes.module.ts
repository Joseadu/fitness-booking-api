import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Box } from './entities/box.entity';
import { BoxesService } from './boxes.service';
import { BoxesController } from './boxes.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Box])],
    controllers: [BoxesController],
    providers: [BoxesService],
    exports: [TypeOrmModule, BoxesService],
})
export class BoxesModule { }
