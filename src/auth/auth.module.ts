import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { ProfilesModule } from '../profiles/profiles.module';

@Module({
    imports: [ConfigModule, PassportModule, TypeOrmModule, ProfilesModule],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [PassportModule, JwtStrategy, AuthService],
})
export class AuthModule { }
