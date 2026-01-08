import { IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateProfileDto {


    @IsString()
    @IsOptional()
    fullName?: string;

    @IsUrl()
    @IsOptional()
    avatarUrl?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    emergencyContact?: string;

    // Date validators can differ, using IsString or specific date validation
    @IsOptional()
    birthDate?: Date;

    @IsUUID()
    @IsOptional()
    activeBoxId?: string;
}
