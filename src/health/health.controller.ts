import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
    constructor(private dataSource: DataSource) { }

    @Get()
    async check() {
        // Verificar conexión con consulta nativa ligera (SELECT 1)
        await this.dataSource.query('SELECT 1');
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
