import { IsOptional, IsString, IsUUID, IsUrl } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateProfileDto {

    @IsString()
    @IsOptional()
    @Expose({ name: 'full_name' })
    fullName?: string;

    @IsUrl()
    @IsOptional()
    @Expose({ name: 'avatar_url' })
    avatarUrl?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    @Expose({ name: 'emergency_contact' })
    emergencyContact?: string;

    // Date validators can differ, using IsString or specific date validation
    @IsOptional()
    @Expose({ name: 'birth_date' })
    birthDate?: Date;

    @IsUUID()
    @IsOptional()
    @Expose({ name: 'active_box_id' })
    activeBoxId?: string;
}
