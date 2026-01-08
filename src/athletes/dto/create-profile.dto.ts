import { IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';

export class CreateProfileDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    fullName?: string;

    @IsUrl()
    @IsOptional()
    avatarUrl?: string;

    @IsUrl()
    @IsOptional()
    website?: string;

    @IsUUID()
    @IsOptional()
    activeBoxId?: string;
}
