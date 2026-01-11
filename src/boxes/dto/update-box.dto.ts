import { PartialType } from '@nestjs/mapped-types';
import { CreateBoxDto } from './create-box.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBoxDto extends PartialType(CreateBoxDto) {
    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}
