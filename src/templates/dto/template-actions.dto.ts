import { IsString, IsNotEmpty, IsUUID, Matches } from 'class-validator';

export class ImportTemplateDto {
    @IsUUID()
    @IsNotEmpty()
    boxId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
    weekStartDate: string; // Lunes de la semana origen
}

export class ApplyTemplateDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' })
    targetWeekStartDate: string; // Lunes de la semana destino
}
