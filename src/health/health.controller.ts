import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthCheck } from '../health-check/entities/health-check.entity';

@Controller('health')
export class HealthController {
    constructor(
        @InjectRepository(HealthCheck)
        private healthCheckRepository: Repository<HealthCheck>,
    ) { }

    @Get()
    async check() {
        // Verificar conexión a base de datos intentando una consulta simple
        await this.healthCheckRepository.count();
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
