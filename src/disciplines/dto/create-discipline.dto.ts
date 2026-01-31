import { IsNotEmpty, IsOptional, IsString, IsUUID, IsUrl, Matches } from 'class-validator';

export class CreateDisciplineDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsUUID()
    @IsNotEmpty()
    boxId: string;

    @IsString()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    @IsUrl({}, { message: 'video_url must be a valid URL' })
    @Matches(
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|instagram\.com|instagr\.am)\/.+$/,
        { message: 'video_url must be a YouTube or Instagram URL' }
    )
    video_url?: string;

    @IsOptional()
    durationMinutes?: number;

    @IsOptional()
    isActive?: boolean;

    @IsOptional()
    displayOrder?: number;
}
