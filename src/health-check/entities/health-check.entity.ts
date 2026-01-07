import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('health_check')
export class HealthCheck {
    @PrimaryGeneratedColumn()
    id: number;
}
