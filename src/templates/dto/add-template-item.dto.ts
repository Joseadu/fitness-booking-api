import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, Matches, Min, Max } from 'class-validator';

export class AddTemplateItemDto {
    @IsUUID()
    @IsNotEmpty()
    discipline_id: string;

    @IsUUID()
    @IsOptional()
    trainer_id?: string;

    @IsNumber()
    @Min(1)
    @Max(7)
    dayOfWeek: number; // 1=Lunes

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be HH:mm' })
    start_time: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{2}:\d{2}$/, { message: 'Time must be HH:mm' })
    end_time: string;

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
