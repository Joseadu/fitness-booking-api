import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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

    @IsOptional()
    durationMinutes?: number;

    @IsOptional()
    isActive?: boolean;

    @IsOptional()
    displayOrder?: number;
}
