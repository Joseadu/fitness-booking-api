import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateInvitationDto {
    @IsEmail({}, { message: 'Formato de email incorrecto' })
    @IsNotEmpty()
    email: string;
}
