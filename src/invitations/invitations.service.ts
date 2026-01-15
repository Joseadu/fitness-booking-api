import { Injectable, BadRequestException, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { Resend } from 'resend';

import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationErrorCode } from './dto/invitation-error.dto';
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

        let supabaseUserId: string | null = null;
        let isNewUser = false;
        let tempPassword = '';

        try {
            // 1. Check if user exists in Supabase and get their ID
            const { data: listData } = await this.supabaseAdmin.auth.admin.listUsers();
            const existingUser = listData?.users?.find((u: any) => u.email === email);

            if (existingUser) {
                // User exists → Check if already a member of THIS box
                const existingMembership = await this.membershipRepository.findOne({
                    where: {
                        user_id: existingUser.id,
                        box_id: boxId
                    }
                });

                if (existingMembership) {
                    throw new BadRequestException({
                        statusCode: 400,
                        error: InvitationErrorCode.ALREADY_MEMBER,
                        message: 'El usuario ya es miembro de este box.'
                    });
                }

                // User exists but not a member → Path B
                isNewUser = false;
                supabaseUserId = existingUser.id;
                this.logger.log(`Usuario existente detectado: ${email} (ID: ${supabaseUserId}). Path B.`);
            } else {
                // User doesn't exist → Path A (create new user)
                tempPassword = this.generateTempPassword();

                const { data: newUser, error: createError } = await this.supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        mustChangePassword: true,
                        role: 'athlete'
                    }
                });

                if (createError) {
                    throw createError;
                }

                isNewUser = true;
                if (!newUser.user) throw new InternalServerErrorException('User created but no user object returned');
                supabaseUserId = newUser.user.id;

                // Create Profile locally
                const emailUsername = email.split('@')[0];
                const profile = this.profileRepository.create({
                    id: supabaseUserId,
                    fullName: emailUsername,
                });
                await this.profileRepository.save(profile);

                this.logger.log(`Usuario nuevo creado ${supabaseUserId}. Path A.`);
            }

        } catch (error) {
            // Re-throw BadRequestException as-is (for frontend to catch)
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error('Error gestionando usuario en Supabase', error);
            throw new InternalServerErrorException('Error inviting user');
        }

        // 2. Check for existing pending invitation
        const existingInvite = await this.invitationRepository.findOne({
            where: { email, box_id: boxId, status: InvitationStatus.PENDING }
        });

        if (existingInvite) {
            throw new BadRequestException({
                statusCode: 400,
                error: InvitationErrorCode.PENDING_INVITATION,
                message: 'Este usuario ya tiene una invitación pendiente.'
            });
        }

        const invitation = this.invitationRepository.create({
            box_id: boxId,
            email: email,
            user_id: supabaseUserId ?? null,
            status: InvitationStatus.PENDING
        });

        const savedInvitation = await this.invitationRepository.save(invitation);

        // 3. Enviar Email (Resend)
        const box = await this.boxRepository.findOne({ where: { id: boxId } });
        const boxName = box?.name || 'un gimnasio';
        await this.sendInvitationEmail(email, isNewUser, boxName, savedInvitation.id, tempPassword);

        // 4. Return standardized response
        return {
            success: true,
            data: {
                invitation: {
                    id: savedInvitation.id,
                    email: savedInvitation.email,
                    status: savedInvitation.status,
                    boxId: savedInvitation.box_id,
                    createdAt: savedInvitation.created_at
                },
                path: isNewUser ? 'new_user' : 'existing_user',
                emailSent: true
            },
            message: isNewUser
                ? 'Invitación enviada. Se ha creado una cuenta nueva para el usuario.'
                : 'Invitación enviada. El usuario recibirá un enlace para unirse.'
        };
    }

    private async sendInvitationEmail(to: string, isNewUser: boolean, boxName: string, invitationId: string, tempPassword?: string) {
        if (!this.resend) {
            this.logger.warn(`Resend not configured. Simulated email to ${to}. New User: ${isNewUser}. Pass: ${tempPassword}`);
            return;
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
        const acceptLink = `${frontendUrl}/accept-invitation?id=${invitationId}`;

        const subject = isNewUser
            ? 'Bienvenido a Fitness Booking - Tus credenciales'
            : `Has sido invitado a ${boxName}`;

        const html = isNewUser
            ? `<p>Has sido invitado a unirte a <strong>${boxName}</strong> en Fitness Booking App.</p>
               <p>Tus credenciales temporales son:</p>
               <ul>
                 <li><strong>Email:</strong> ${to}</li>
                 <li><strong>Contraseña:</strong> ${tempPassword}</li>
               </ul>
               <p>Por favor, inicia sesión y cambia tu contraseña.</p>`
            : `<p>¡Hola!</p>
               <p>Has sido invitado a unirte a <strong>${boxName}</strong> en Fitness Booking App.</p>
               <p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
               <p><a href="${acceptLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Aceptar Invitación</a></p>
               <p>O copia y pega este enlace en tu navegador:</p>
               <p style="color: #6B7280; font-size: 14px;">${acceptLink}</p>`;

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
            where: {
                box_id: boxId,
                status: InvitationStatus.PENDING
            },
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

        // CRITICAL: Validate that the logged-in user is the one invited
        if (!invitation.user_id) {
            throw new BadRequestException('Invitation is not linked to a user. Cannot accept.');
        }

        if (invitation.user_id !== userId) {
            throw new BadRequestException('You cannot accept an invitation that was not sent to you.');
        }

        // Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Verificar si ya existe membership (idempotencia)
            const existingMembership = await queryRunner.manager.findOne(BoxMembership, {
                where: {
                    user_id: invitation.user_id, // Use invitation's user_id
                    box_id: invitation.box_id
                }
            });

            if (existingMembership) {
                // Ya existe membership → solo marcar invitación como aceptada
                invitation.status = InvitationStatus.ACCEPTED;
                invitation.updated_at = new Date();
                await queryRunner.manager.save(invitation);
                await queryRunner.commitTransaction();

                this.logger.log(`Membership already exists for user ${invitation.user_id} in box ${invitation.box_id}. Invitation marked as accepted.`);
                return {
                    success: true,
                    data: {
                        membership: {
                            id: existingMembership.id,
                            userId: existingMembership.user_id,
                            boxId: existingMembership.box_id,
                            role: existingMembership.role,
                            isActive: existingMembership.is_active
                        },
                        alreadyExisted: true
                    },
                    message: 'Ya eres miembro de este box.'
                };
            }

            // 2. Actualizar Invitación
            invitation.status = InvitationStatus.ACCEPTED;
            invitation.updated_at = new Date(); // Force update time
            await queryRunner.manager.save(invitation);

            // 3. Crear Membresía (usando el user_id de la invitación)
            const membership = queryRunner.manager.create(BoxMembership, {
                user_id: invitation.user_id, // CRITICAL: Use invitation's user_id, not JWT userId
                box_id: invitation.box_id,
                role: 'athlete',
                is_active: true
            });
            await queryRunner.manager.save(membership);

            // 4. Commit
            await queryRunner.commitTransaction();

            return {
                success: true,
                data: {
                    membership: {
                        id: membership.id,
                        userId: membership.user_id,
                        boxId: membership.box_id,
                        role: membership.role,
                        isActive: membership.is_active
                    },
                    alreadyExisted: false
                },
                message: 'Invitación aceptada correctamente. ¡Bienvenido al box!'
            };

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    /**
 * Acepta todas las invitaciones pendientes para un email
 */
    async acceptPendingInvitations(userId: string, email: string) {
        // 1. Buscamos invitaciones pendientes por email
        const invitations = await this.invitationRepository.find({
            where: {
                email: email,
                status: InvitationStatus.PENDING
            }
        });

        if (invitations.length === 0) {
            return { message: 'No pending invitations', count: 0 };
        }

        // 2. Las aceptamos una por una (reutiliza tu lógica de accept)
        const results: any[] = [];
        for (const invitation of invitations) {
            try {
                // LLAMA A TU MÉTODO accept() EXISTENTE
                const res = await this.accept(invitation.id, userId);
                results.push(res);
            } catch (error) {
                this.logger.error(`Failed to accept invitation ${invitation.id}`, error);
            }
        }

        return { message: 'Processed', count: results.length, results };
    }

    /**
     * Find pending invitations for a user (for notification panel)
     */
    async findPendingByEmail(email: string) {
        return this.invitationRepository.find({
            where: {
                email: email,
                status: InvitationStatus.PENDING
            },
            relations: ['box'],
            order: { created_at: 'DESC' }
        });
    }

    /**
     * Reject an invitation (for notification panel)
     */
    async reject(id: string, userId: string): Promise<any> {
        const invitation = await this.invitationRepository.findOne({ where: { id } });

        if (!invitation) throw new NotFoundException('Invitation not found');
        if (invitation.status !== InvitationStatus.PENDING) {
            throw new BadRequestException('Invitation is not pending');
        }

        // Update status to rejected
        invitation.status = InvitationStatus.REJECTED;
        invitation.updated_at = new Date();
        await this.invitationRepository.save(invitation);

        return { message: 'Invitation rejected' };
    }

    private generateTempPassword(): string {
        return 'fb-' + crypto.randomBytes(4).toString('hex');
    }
}
