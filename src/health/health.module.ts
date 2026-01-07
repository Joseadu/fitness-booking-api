import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthCheck } from '../health-check/entities/health-check.entity';

@Module({
    imports: [TypeOrmModule.forFeature([HealthCheck])],
    controllers: [HealthController],
})
export class HealthModule { }
