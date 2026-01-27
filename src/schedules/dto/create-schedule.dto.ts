import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateScheduleDto {
    @IsNotEmpty() @IsString() date: string;

    @IsNotEmpty() @IsString() start_time: string;

    @IsNotEmpty() @IsString() end_time: string;

    @IsNotEmpty() @IsString() discipline_id: string;

    @IsNotEmpty() @IsString() box_id: string;

    @IsOptional() @IsString() trainer_id?: string;

    @IsOptional() @IsNumber() max_capacity?: number;

    // @IsOptional() @IsNumber() capacity?: number; // Removed legacy 'capacity' to clean up

    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() description?: string;

    @IsOptional()
    @IsBoolean()
    is_visible?: boolean;
}
