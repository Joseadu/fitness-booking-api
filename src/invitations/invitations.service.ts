import { Injectable, BadRequestException, NotFoundException, Logger, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { Resend } from 'resend';

import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationErrorCode } from './dto/invitation-error.dto';
import { Profile } from '../profiles/entities/profile.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';
import { Box } from '../boxes/entities/box.entity';
import { MembershipsService } from '../memberships/memberships.service';
import { NotificationsService } from '../notifications/notifications.service';

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
        private readonly membershipsService: MembershipsService,
        private readonly notificationsService: NotificationsService,
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

    async create(boxId: string, createInvitationDto: CreateInvitationDto, user: any) {
        this.verifyOwnership(boxId, user);
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

                // User exists but not a member → Path B (Existing User)
                isNewUser = false;
                supabaseUserId = existingUser.id;
                this.logger.log(`[INVITATION] Classification: Path B (Existing User). Email: ${email}, ID: ${supabaseUserId}`);

                return this.handlePathBInvitation(boxId, email, supabaseUserId);
            } else {
                // User doesn't exist → Path A (New User - Setup Flow)
                this.logger.log(`[INVITATION] Classification: Path A (New User). Email: ${email}`);
                return this.handlePathAInvitation(boxId, email);
            }

        } catch (error) {
            // Re-throw BadRequestException as-is (for frontend to catch)
            if (error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error('Error gestionando usuario en Supabase', error);
            throw new InternalServerErrorException('Error inviting user');
        }






    }

    private async sendInvitationEmail(to: string, isNewUser: boolean, boxName: string, invitationId: string, tempPassword?: string, token?: string) {
        if (!this.resend) {
            this.logger.warn(`Resend not configured. Simulated email to ${to}. New User: ${isNewUser}. Token: ${token}`);
            return;
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';

        // Link logic
        let actionLink = '';
        if (isNewUser && token) {
            // Path A: Setup Account
            actionLink = `${frontendUrl}/setup-account?token=${token}`;
        } else {
            // Path B: Accept Invitation
            actionLink = `${frontendUrl}/accept-invitation?id=${invitationId}`;
        }

        const subject = isNewUser
            ? `Únete a ${boxName} - Configura tu cuenta`
            : `Has sido invitado a ${boxName}`;

        const html = isNewUser
            ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>¡Bienvenido a ${boxName}!</h2>
                    <p>Has sido invitado a unirte a nuestro box en Fitness Booking App.</p>
                    <p>Para comenzar, por favor configura tu contraseña haciendo clic en el siguiente enlace:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${actionLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Configurar mi Cuenta
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">O copia este enlace: <br> ${actionLink}</p>
                    <p>Una vez configurada tu cuenta, tendrás acceso inmediato al box.</p>
                </div>
            `
            : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>¡Hola!</h2>
                    <p>Has sido invitado a unirte a <strong>${boxName}</strong>.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${actionLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Aceptar Invitación
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">O copia este enlace: <br> ${actionLink}</p>
                </div>
            `;

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
        }
    }

    async findAllByBox(boxId: string, user: any) {
        this.verifyOwnership(boxId, user);
        return this.invitationRepository.find({
            where: {
                box_id: boxId,
                status: InvitationStatus.PENDING
            },
            order: { created_at: 'DESC' }
        });
    }

    async remove(id: string, user: any) {
        const invite = await this.invitationRepository.findOne({ where: { id } });
        if (!invite) throw new NotFoundException('Invitation not found');

        this.verifyOwnership(invite.box_id, user);

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

        let membership: BoxMembership; // Declare outside try block

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

            // 3. Crear Membresía via Service (Centralized logic)
            // Note: We use queryRunner to keep it in the same transaction
            membership = await this.membershipsService.create(invitation.user_id, {
                boxId: invitation.box_id,
                role: 'athlete',
                membershipType: 'athlete'
            }, queryRunner);

            // 4. Commit
            await queryRunner.commitTransaction();

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }

        // Send notification to box owner (after transaction completes)
        try {
            const invitationWithBox = await this.invitationRepository.findOne({
                where: { id },
                relations: ['box', 'profile']
            });
            if (invitationWithBox) {
                await this.notificationsService.notifyInvitationAccepted(invitationWithBox);
            }
        } catch (error) {
            this.logger.error('Failed to send invitation accepted notification', error);
        }

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

    /**
     * Handle Path A: New User (Setup Flow with Token)
     */
    private async handlePathAInvitation(boxId: string, email: string) {
        this.logger.log(`Handling Path A (New User) for ${email} in box ${boxId}`);
        // 1. Generate random password for Supabase (user will overwrite it later)
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const token = crypto.randomUUID(); // Setup Token for verification

        // 2. Create User in Supabase
        const { data: newUser, error: createError } = await this.supabaseAdmin.auth.admin.createUser({
            email: email,
            password: randomPassword,
            email_confirm: true,
            user_metadata: { mustChangePassword: true, role: 'athlete' }
        });

        if (createError) {
            this.logger.error(`Error creating user in Supabase for ${email}`, createError);
            throw createError;
        }

        if (!newUser.user) {
            this.logger.error(`User created but no user object returned for ${email}`);
            throw new InternalServerErrorException('User created but no user object returned');
        }

        const supabaseUserId = newUser.user.id;
        this.logger.log(`Created Supabase user ${supabaseUserId}`);

        // 3. Create Local Profile
        const emailUsername = email.split('@')[0];
        const profile = this.profileRepository.create({
            id: supabaseUserId,
            fullName: emailUsername,
        });
        await this.profileRepository.save(profile);

        // 4. Create Invitation with Token
        const invitation = this.invitationRepository.create({
            box: { id: boxId } as Box,
            email,
            user_id: supabaseUserId,
            status: InvitationStatus.PENDING,
            token: token
        });
        const savedInvitation = await this.invitationRepository.save(invitation);

        // 5. Send Setup Email (with Token Link)
        const box = await this.boxRepository.findOne({ where: { id: boxId } });
        const boxName = box?.name || 'un gimnasio';

        // Pass token to email service (isNewUser=true -> Setup Email)
        await this.sendInvitationEmail(email, true, boxName, savedInvitation.id, undefined, token);

        // Send in-app notification (will be visible when user creates account)
        try {
            await this.notificationsService.notifyInvitationSent({
                ...savedInvitation,
                box: box
            });
        } catch (error) {
            this.logger.error('Failed to send invitation notification', error);
            // Don't fail the invitation if notification fails
        }

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
                path: 'new_user',
                emailSent: true
            },
            message: 'Invitación enviada. El usuario recibirá un enlace para configurar su cuenta.'
        };
    }

    /**
     * Handle Path B: Existing User (Standard Link Flow)
     */
    private async handlePathBInvitation(boxId: string, email: string, userId: string) {
        // 1. Check for existing pending invitation
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

        // 2. Create Invitation (No Token needed for Path B)
        const invitation = this.invitationRepository.create({
            box_id: boxId,
            email: email,
            user_id: userId,
            status: InvitationStatus.PENDING
        });
        const savedInvitation = await this.invitationRepository.save(invitation);

        // 3. Send Invitation Email (Standard Link)
        const box = await this.boxRepository.findOne({ where: { id: boxId } });
        const boxName = box?.name || 'un gimnasio';

        await this.sendInvitationEmail(email, false, boxName, savedInvitation.id);

        // Send in-app notification
        try {
            await this.notificationsService.notifyInvitationSent({
                ...savedInvitation,
                box: box
            });
        } catch (error) {
            this.logger.error('Failed to send invitation notification', error);
        }

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
                path: 'existing_user',
                emailSent: true
            },
            message: 'Invitación enviada. El usuario recibirá un enlace para unirse.'
        };
    }

    /**
     * Validate setup token (Front calls this on page load)
     */
    async validateToken(token: string) {
        this.logger.log(`Validating token: ${token}`);
        const invitation = await this.invitationRepository.findOne({
            where: { token, status: InvitationStatus.PENDING },
            relations: ['box']
        });

        if (!invitation) {
            this.logger.warn(`Invalid or expired token: ${token}`);
            throw new NotFoundException('Invalid or expired token');
        }

        this.logger.log(`Token valid for email: ${invitation.email}`);

        return {
            valid: true,
            email: invitation.email,
            boxName: invitation.box?.name || 'Box',
            boxId: invitation.box_id
        };
    }

    /**
     * Complete Setup: Set password + Auto-accept invitation
     */
    async setupAccount(token: string, password: string) {
        this.logger.log(`Setting up account with token: ${token}`);

        // 1. Validate Token again
        const invitation = await this.invitationRepository.findOne({
            where: { token, status: InvitationStatus.PENDING }
        });

        if (!invitation || !invitation.user_id) {
            throw new BadRequestException('Invalid token or invitation');
        }

        // 2. Update Password in Supabase
        const { error: updateError } = await this.supabaseAdmin.auth.admin.updateUserById(
            invitation.user_id,
            { password: password, email_confirm: true }
        );

        if (updateError) {
            this.logger.error(`Failed to update password for user ${invitation.user_id}`, updateError);
            throw new InternalServerErrorException('Could not set password');
        }

        // 3. Auto-Accept Invitation (Create Membership)
        await this.membershipsService.create(invitation.user_id, {
            boxId: invitation.box_id,
            role: 'athlete',
            membershipType: 'athlete'
        });

        // 4. Mark Invitation as Accepted & Invalidate Token
        invitation.status = InvitationStatus.ACCEPTED;
        invitation.token = null; // Invalidate token usage
        await this.invitationRepository.save(invitation);

        this.logger.log(`Setup complete for user ${invitation.user_id}. Auto-accepted to box ${invitation.box_id}`);

        return {
            success: true,
            message: 'Account setup complete. Welcome!'
        };
    }
    private verifyOwnership(boxId: string, user: any) {
        if (!user || !user.memberships) {
            throw new ForbiddenException('No membership context found');
        }

        const hasPermission = user.roles.includes('admin') || user.memberships.some((m: any) =>
            m.boxId === boxId && ['business_owner'].includes(m.role)
        );

        if (!hasPermission) {
            throw new ForbiddenException(`You do not have permission to manage content for Box ${boxId}`);
        }
    }
}
