import { Injectable, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DataSource } from 'typeorm';
import { SignUpDto, UserRole } from './dto/sign-up.dto';
import { Profile } from '../users/entities/profile.entity';
import { Box } from '../boxes/entities/box.entity';
import { BoxMembership } from '../memberships/entities/box-membership.entity';

@Injectable()
export class AuthService {
    private supabasePublic: SupabaseClient; // Cliente Público para hacer SignUp normal (y disparar emails)
    private supabaseAdmin: SupabaseClient; // Cliente Admin para borrar usuarios si falla la DB
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private configService: ConfigService,
        private dataSource: DataSource,
    ) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !serviceRoleKey || !anonKey) {
            this.logger.error('Supabase credentials missing');
            throw new InternalServerErrorException('Auth configuration error');
        }

        // Cliente con Service Role (Superbién para borrar, gestión, etc.)
        this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // Cliente con Anon Key (Simula ser un usuario normal para el registro y envío de emails)
        this.supabasePublic = createClient(supabaseUrl, anonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }

    async register(signUpDto: SignUpDto) {
        const { email, password, fullName, role, boxId, avatarUrl } = signUpDto;
        let supabaseUserId: string | null = null;

        // 1. Transaction Runner
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 2. SignUp en Supabase (Usando cliente PÚBLICO para disparar el email)
            const frontendUrl = this.configService.get<string>('FRONTEND_URL');
            const { data: authData, error: authError } = await this.supabasePublic.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName, role }, // User Metadata
                    emailRedirectTo: frontendUrl,
                }
            });

            if (authError) throw new BadRequestException(authError.message);
            if (!authData.user) throw new InternalServerErrorException('Failed to create user in Supabase');

            // IMPORTANTE: Si es Owner, Supabase probablemente NO deje loguear hasta confirmar email.
            // Pero el usuario YA EXISTE. Seguimos adelante para crear la estructura en DB.
            // (Si el usuario no confirma el email, se quedará la estructura creada pero inactiva en Supabase)

            supabaseUserId = authData.user.id;

            // 3. Create Local Profile
            const profile = queryRunner.manager.create(Profile, {
                id: supabaseUserId,
                fullName,
                avatarUrl,
            });
            await queryRunner.manager.save(profile);

            // 4. Role Specific Logic
            if (role === UserRole.BUSINESS_OWNER) {
                // Create Box
                const box = queryRunner.manager.create(Box, {
                    name: `${fullName}'s Box`,
                    owner_id: supabaseUserId,
                    created_at: new Date(),
                    updated_at: new Date(),
                    is_active: true,
                });
                const savedBox = await queryRunner.manager.save(box);

                // Create Membership (Owner)
                const membership = queryRunner.manager.create(BoxMembership, {
                    userId: supabaseUserId,
                    boxId: savedBox.id,
                    role: 'business_owner',
                    isActive: true,
                });
                await queryRunner.manager.save(membership);

                // Update Profile with active Box
                profile.activeBoxId = savedBox.id;
                await queryRunner.manager.save(profile);
            } else if (role === UserRole.ATHLETE && boxId) {
                // Check if box exists? (Optional, DB constraint will fail if not)
                // Create Membership (Pending/Athlete)
                const membership = queryRunner.manager.create(BoxMembership, {
                    userId: supabaseUserId,
                    boxId: boxId,
                    role: 'athlete',
                    isActive: true, // Or false if you want 'pending' logic later
                });
                await queryRunner.manager.save(membership);
            }

            // 5. Commit DB Transaction
            await queryRunner.commitTransaction();

            return {
                id: supabaseUserId,
                email,
                role,
                profile: {
                    id: supabaseUserId,
                    fullName,
                    avatarUrl
                },
                message: 'User registered successfully'
            };

        } catch (error) {
            // Rollback DB
            await queryRunner.rollbackTransaction();

            // CASO COMPENSATORIO: Borrar usuario de Supabase si se creó pero falló la DB
            if (supabaseUserId) {
                await this.supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
                this.logger.warn(`Rolled back Supabase user ${supabaseUserId} due to DB error`);
            }

            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
