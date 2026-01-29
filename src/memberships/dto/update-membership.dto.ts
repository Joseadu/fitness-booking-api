import { IsOptional, IsString } from 'class-validator';

export class UpdateMembershipDto {
    @IsOptional()
    @IsString()
    role?: string;
}
