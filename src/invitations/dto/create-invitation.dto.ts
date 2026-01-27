import { IsEmail, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateInvitationDto {
    @IsEmail({}, { message: 'Formato de email incorrecto' })
    @IsNotEmpty()
    @Expose({ name: 'invited_email' })
    email: string;
}
