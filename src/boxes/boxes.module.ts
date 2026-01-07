import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Box } from './entities/box.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Box])],
    exports: [TypeOrmModule],
})
export class BoxesModule { }
