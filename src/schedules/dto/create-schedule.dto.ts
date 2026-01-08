import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, Matches } from 'class-validator';

export class CreateScheduleDto {
    @IsUUID()
    @IsNotEmpty()
    boxId: string;

    @IsUUID()
    @IsNotEmpty()
    disciplineId: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
    date: string; // "2024-01-30"

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be HH:mm' })
    startTime: string; // "09:00"

    @IsNumber()
    @IsNotEmpty()
    durationMinutes: number; // Para calcular endTime

    @IsNumber()
    @IsNotEmpty()
    capacity: number;

    @IsUUID()
    @IsOptional()
    trainerId?: string;
}
