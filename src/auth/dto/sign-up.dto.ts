import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export enum UserRole {
    ATHLETE = 'athlete',
    BUSINESS_OWNER = 'business_owner',
}

export class SignUpDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;

    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsEnum(UserRole)
    role: UserRole;

    @IsUUID()
    @IsOptional()
    boxId?: string; // Para atletas que se registran con invitación o código

    @IsString()
    @IsOptional()
    avatarUrl?: string;
}
