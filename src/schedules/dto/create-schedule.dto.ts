import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateScheduleDto {
    @IsNotEmpty() @IsString() date: string;
    @IsNotEmpty() @IsString() startTime: string;
    @IsNotEmpty() @IsString() endTime: string;
    @IsNotEmpty() @IsString() disciplineId: string;

    // Como boxId se suele sacar del query param o auth, lo dejamos o lo añadimos según tu lógica actual.
    // El usuario pidió: @IsOptional() @IsString() trainerId?: string;
    // Si tu lógica actual requiere boxId en el DTO, mantenlo. Si va por Query param en Controller, quítalo.
    // Viendo el controller actual: @Query('boxId') boxId: string no se usa en create(@Body()).
    // El servicio create() anterior recibía todo el DTO.
    // Asumiré que boxId DEBE ir en el DTO si no se pasa por parametro.
    // Pero el snippet del usuario NO TIENE boxId. 
    // Voy a mantener boxId para no romper la app, o añadirlo al DTO del usuario.
    @IsNotEmpty() @IsString() boxId: string;

    @IsOptional() @IsString() trainerId?: string;
    @IsOptional() @IsNumber() maxCapacity?: number;
    @IsOptional() @IsNumber() capacity?: number; // Legacy support
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() description?: string;
}
