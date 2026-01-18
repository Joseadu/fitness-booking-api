import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        private profilesService: ProfilesService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('SUPABASE_JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        // Fetch full profile with memberships relationships
        const profile = await this.profilesService.findOne(payload.sub);

        // Extract all unique roles from memberships
        // (If user is owner in ANY box, they get 'business_owner' role in session context)
        // Note: For multi-tenant strictness, guards should check specific BoxID, 
        // but for now we trust global role capability.
        const roles = profile.memberships?.map(m => m.role) || [];
        // Also map 'membership_type' if it differs, or use logic

        // Add roles to the user object (req.user)
        return {
            userId: payload.sub,
            email: payload.email,
            roles: [...new Set(roles)], // Unique roles
            ...payload
        };
    }
}
