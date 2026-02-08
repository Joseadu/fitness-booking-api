import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateInvitationDto {
    @IsEmail({}, { message: 'Formato de email incorrecto' })
    @IsNotEmpty()
    @Expose({ name: 'invited_email' })
    email: string;

    @Expose()
    @IsString()
    @IsOptional()
    role?: string;

    @IsString()
    @IsNotEmpty()
    @Expose() // Ensure it's exposed if we rely on transformation
    boxId: string;
}
