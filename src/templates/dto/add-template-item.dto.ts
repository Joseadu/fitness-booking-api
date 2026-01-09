import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, Matches, Min, Max } from 'class-validator';

export class AddTemplateItemDto {
    @IsUUID()
    @IsNotEmpty()
    disciplineId: string;

    @IsUUID()
    @IsOptional()
    trainerId?: string;

    @IsNumber()
    @Min(1)
    @Max(7)
    dayOfWeek: number; // 1=Lunes

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be HH:mm' })
    startTime: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be HH:mm' })
    endTime: string;

    @IsNumber()
    @IsNotEmpty()
    maxCapacity: number;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;
}
