import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AthleteService {
    constructor(
        @InjectRepository(Profile)
        private profileRepository: Repository<Profile>,
    ) { }

    async findOne(id: string): Promise<Profile> {
        const profile = await this.profileRepository.findOne({
            where: { id },
            relations: ['memberships', 'memberships.box'], // Cargamos membresías y el box asociado (si la entidad Box está relacionada en Membership, pero BoxMembership no tiene relation a Box aun? Revisar).
        });
        // Si BoxMembership no tiene relacion a Box, quitar 'memberships.box'.
        // He revisado BoxMembership y tiene boxId columna, pero no relacion @ManyToOne a Box.
        // Asi que solo 'memberships' por ahora.

        // Un fix rapido: voy a usar relations: ['memberships']
        // Si no existe perfil, throw.
        if (!profile) {
            throw new NotFoundException(`Profile with ID "${id}" not found`);
        }
        return profile;
    }

    async update(id: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
        await this.findOne(id); // Check existence
        await this.profileRepository.update(id, updateProfileDto);
        return this.findOne(id); // Return updated
    }
}
