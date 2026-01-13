import { Injectable, BadRequestException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Profile } from '../users/entities/profile.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';
import { Box } from '../boxes/entities/box.entity';

@Injectable()
export class InvitationsService {
    private supabaseAdmin: SupabaseClient;
    private readonly logger = new Logger(InvitationsService.name);

    constructor(
        @InjectRepository(Invitation)
        private invitationRepository: Repository<Invitation>,
        @InjectRepository(Profile)
        private profileRepository: Repository<Profile>,
        @InjectRepository(BoxMembership)
        private membershipRepository: Repository<BoxMembership>,
        @InjectRepository(Box)
        private boxRepository: Repository<Box>,
        private dataSource: DataSource,
        private configService: ConfigService,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && serviceRoleKey) {
            this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false },
            });
        }
    }

    async create(boxId: string, createInvitationDto: CreateInvitationDto) {
        const { email } = createInvitationDto;

        // 1. Validar si ya es miembro
        const existingMember = await this.membershipRepository.createQueryBuilder('membership')
            .leftJoin('membership.profile', 'profile') // Asumiendo relación en BoxMembership
            // Necesitamos buscar por email. Ojo: Profile no tiene email en DB local si solo guardamos IDs.
            // PERO: Si seguimos la migración, deberíamos tener auth_users o buscar en Supabase.
            // ESTRATEGIA: Buscamos el usuario en Supabase por email primero.
            .getOne();
        // ^ Esto es complejo sin email en Profile.
        // Simplificación: Buscamos user en Supabase primero.

        let supabaseUserId: string | null = null;
        let isNewUser = false;

        try {
            // Verificar si el usuario existe en Supabase
            const { data: { users }, error } = await this.supabaseAdmin.auth.admin.listUsers();
            // listUsers no filtra por email nativamente en todas las versiones, pero admin.getUserById sí.
            // Para email usamos listUsers con filtro o lo creamos y capturamos error.
            // Mejor: intentamos crear, si falla por "existe", es Path B.

            // INTENTO PATH A (Crear Usuario)
            const tempPassword = this.generateTempPassword();

            const { data: newUser, error: createError } = await this.supabaseAdmin.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true, // Auto-confirmar
                user_metadata: { mustChangePassword: true }
            });

            if (createError) {
                // Si el error es "User already registered", es Path B.
                if (createError.message.includes('already has been registered') || createError.status === 422) {
                    isNewUser = false;
                    // Necesitamos el ID del usuario existente.
                    // Lo buscamos "a la fuerza" (lamentablemente listUsers es paginado, pero es lo que hay sin tabla local de emails)
                    // TODO: Idealmente Profile debería tener copia del email para búsquedas rápidas.
                    // Por ahora, asumimos que NO tenemos el ID fácil y creamos la invitación solo con Email.
                    this.logger.log(`Usuario existente detectado para ${email}. Path B.`);
                } else {
                    throw createError;
                }
            } else {
                isNewUser = true;
                supabaseUserId = newUser.user.id;

                // Crear Profile local inmediatamente
                const profile = this.profileRepository.create({
                    id: supabaseUserId,
                    fullName: 'Invited Athlete', // Placeholder
                    // avatarUrl: ...
                });
                await this.profileRepository.save(profile);

                this.logger.log(`Usuario nuevo creado ${supabaseUserId}. Path A.`);
                this.logger.warn(`CREDENCIALES TEMPORALES (MOCK EMAIL): Email: ${email}, Password: ${tempPassword}`);
            }

        } catch (error) {
            this.logger.error('Error gestionando usuario en Supabase', error);
            throw new InternalServerErrorException('Error inviting user');
        }

        // 2. Crear Invitación
        // Verificamos si ya existe una invitación PENDIENTE para este email y box
        const existingInvite = await this.invitationRepository.findOne({
            where: { email, box_id: boxId, status: InvitationStatus.PENDING }
        });

        if (existingInvite) {
            throw new BadRequestException('User already has a pending invitation for this box');
        }

        const invitation = this.invitationRepository.create({
            box_id: boxId,
            email: email,
            user_id: supabaseUserId ?? null, // Explicitly allow null
            status: InvitationStatus.PENDING
        });

        const savedInvitation = await this.invitationRepository.save(invitation);

        // 3. Respuesta
        return {
            status: 'success',
            path: isNewUser ? 'A (New User)' : 'B (Existing User)',
            invitation: savedInvitation,
            message: isNewUser
                ? 'User created and invited. Check logs for temp credentials.'
                : 'Invitation sent to existing user.'
        };
    }

    async findAllByBox(boxId: string) {
        return this.invitationRepository.find({
            where: { box_id: boxId },
            order: { created_at: 'DESC' }
        });
    }

    async remove(id: string) {
        const invite = await this.invitationRepository.findOne({ where: { id } });
        if (!invite) throw new NotFoundException('Invitation not found');
        return this.invitationRepository.remove(invite);
    }

    async accept(id: string, userId: string): Promise<any> {
        // userId viene del JWT del usuario que ha hecho Login
        const invitation = await this.invitationRepository.findOne({ where: { id } });

        if (!invitation) throw new NotFoundException('Invitation not found');
        if (invitation.status !== InvitationStatus.PENDING) throw new BadRequestException('Invitation is not pending');

        // Validar que el usuario que acepta es el del email (Opcional, pero recomendable)
        // Como no tenemos el email del usuario en el request fácilmente, confiamos en que tiene la ID de la invitación.

        // Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Actualizar Invitación
            invitation.status = InvitationStatus.ACCEPTED;
            invitation.user_id = userId; // Vinculamos definitivamente
            invitation.updated_at = new Date(); // Force update time
            await queryRunner.manager.save(invitation);

            // 2. Crear Membresía
            const membership = queryRunner.manager.create(BoxMembership, {
                user_id: userId,
                box_id: invitation.box_id,
                role: 'athlete',
                is_active: true
            });
            await queryRunner.manager.save(membership);

            // 3. Commit
            await queryRunner.commitTransaction();

            return { message: 'Invitation accepted and membership created', membership };

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    private generateTempPassword(): string {
        return 'fb-' + crypto.randomBytes(4).toString('hex');
    }
}
