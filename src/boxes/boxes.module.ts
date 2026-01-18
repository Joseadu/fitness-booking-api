import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Box } from './entities/box.entity';
import { BoxesService } from './boxes.service';
import { BoxesController } from './boxes.controller';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Box]),
        MembershipsModule
    ],
    controllers: [BoxesController],
    providers: [BoxesService],
    exports: [TypeOrmModule, BoxesService],
})
export class BoxesModule { }
