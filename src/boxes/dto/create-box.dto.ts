import { IsString, IsOptional, IsEmail, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateBoxDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    contact_phone?: string;

    @IsEmail()
    @IsOptional()
    contact_email?: string;

    @IsString()
    @IsOptional()
    logo_url?: string;
}
