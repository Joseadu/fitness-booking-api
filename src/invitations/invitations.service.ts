import { Injectable, BadRequestException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { Resend } from 'resend';

import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { Profile } from '../users/entities/profile.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';
import { Box } from '../boxes/entities/box.entity';

@Injectable()
export class InvitationsService {
    private supabaseAdmin: SupabaseClient;
    private readonly logger = new Logger(InvitationsService.name);
    private resend: Resend;

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
        const resendApiKey = this.configService.get<string>('RESEND_API_KEY');

        if (supabaseUrl && serviceRoleKey) {
            this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false },
            });
        }

        if (resendApiKey) {
            this.resend = new Resend(resendApiKey);
        } else {
            this.logger.warn('RESEND_API_KEY is missing. Emails will not be sent.');
        }
    }

    async create(boxId: string, createInvitationDto: CreateInvitationDto) {
        const { email } = createInvitationDto;

        // 1. Validar si ya es miembro
        const existingMember = await this.membershipRepository.createQueryBuilder('membership')
            .leftJoin('membership.profile', 'profile')
            // TODO: Mejorar búsqueda de usuario existente
            .getOne();

        let supabaseUserId: string | null = null;
        let isNewUser = false;
        let tempPassword = '';

        try {
            // Verificar si el usuario existe en Supabase
            // ... (Lógica de Supabase existente) ...

            // INTENTO PATH A (Crear Usuario)
            tempPassword = this.generateTempPassword();

            const { data: newUser, error: createError } = await this.supabaseAdmin.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true, // Auto-confirmar
                user_metadata: {
                    mustChangePassword: true,
                    role: 'athlete' // IMPORTANTE: Forzar rol de atleta
                }
            });

            if (createError) {
                // Si el error es "User already registered", es Path B.
                if (createError.message.includes('already has been registered') || createError.status === 422) {
                    isNewUser = false;
                    this.logger.log(`Usuario existente detectado para ${email}. Path B.`);
                } else {
                    throw createError;
                }
            } else {
                isNewUser = true;
                if (!newUser.user) throw new InternalServerErrorException('User created but no user object returned');
                supabaseUserId = newUser.user.id;

                // Crear Profile local inmediatamente
                const profile = this.profileRepository.create({
                    id: supabaseUserId,
                    fullName: 'Invited Athlete',
                });
                await this.profileRepository.save(profile);

                this.logger.log(`Usuario nuevo creado ${supabaseUserId}. Path A.`);
            }

        } catch (error) {
            this.logger.error('Error gestionando usuario en Supabase', error);
            throw new InternalServerErrorException('Error inviting user');
        }

        // 2. Crear Invitación
        const existingInvite = await this.invitationRepository.findOne({
            where: { email, box_id: boxId, status: InvitationStatus.PENDING }
        });

        if (existingInvite) {
            throw new BadRequestException('User already has a pending invitation for this box');
        }

        const invitation = this.invitationRepository.create({
            box_id: boxId,
            email: email,
            user_id: supabaseUserId ?? null,
            status: InvitationStatus.PENDING
        });

        const savedInvitation = await this.invitationRepository.save(invitation);

        // 3. Enviar Email (Resend)
        await this.sendInvitationEmail(email, isNewUser, tempPassword);

        // 4. Respuesta
        return {
            status: 'success',
            path: isNewUser ? 'A (New User)' : 'B (Existing User)',
            invitation: savedInvitation,
            message: 'Invitation email sent.'
        };
    }

    private async sendInvitationEmail(to: string, isNewUser: boolean, tempPassword?: string) {
        if (!this.resend) {
            this.logger.warn(`Resend not configured. Simulated email to ${to}. New User: ${isNewUser}. Pass: ${tempPassword}`);
            return;
        }

        const subject = isNewUser
            ? 'Bienvenido a Fitness Booking App'
            : 'Has sido invitado a un nuevo Box';

        const html = isNewUser
            ? `<p>Hola!</p>
               <p>Has sido invitado a unirte a Fitness Booking App.</p>
               <p>Tus credenciales temporales son:</p>
               <ul>
                 <li><strong>Email:</strong> ${to}</li>
                 <li><strong>Contraseña:</strong> ${tempPassword}</li>
               </ul>
               <p>Por favor, inicia sesión y cambia tu contraseña.</p>`
            : `<p>Hola!</p>
               <p>Has sido invitado a unirte a un nuevo Box en Fitness Booking App.</p>
               <p>Abre la aplicación para aceptar la invitación.</p>`;

        try {
            await this.resend.emails.send({
                from: 'onboarding@resend.dev',
                to: to,
                subject: subject,
                html: html
            });
            this.logger.log(`Email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Error sending email to ${to}`, error);
            // No lanzamos error para no romper el flujo principal, pero logueamos
        }
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
