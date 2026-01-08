import { UsersModule } from './users/users.module';
import { MembershipsModule } from './memberships/memberships.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { envSchema } from './config/env.schema';
import { BoxesModule } from './boxes/boxes.module';
import { AthleteModule } from './athletes/athlete.module';
import { DisciplinesModule } from './disciplines/disciplines.module';
import { SchedulesModule } from './schedules/schedules.module';
import { BookingsModule } from './bookings/bookings.module';
import { TemplatesModule } from './templates/templates.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envSchema,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false, // IMPORTANTE: Nunca sincronizar en migración para no dañar DB existente
        ssl: { rejectUnauthorized: false }, // Supabase requiere SSL
      }),
    }),
    AuthModule,
    HealthModule,
    BoxesModule,
    AthleteModule,
    DisciplinesModule,
    SchedulesModule,
    BookingsModule,
    TemplatesModule,
    UsersModule,
    MembershipsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
