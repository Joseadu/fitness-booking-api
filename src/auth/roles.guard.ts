
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // Si no hay usuario (endpoint público sin AuthGuard previo), denegar si requiere roles
        if (!user) {
            return false;
        }

        // Suponemos que el JWT o el AuthGuard ya han poblado user.role
        // Esto puede requerir ajustar el JwtStrategy para asegurar que 'role' viaja en el payload
        // o hacer una búsqueda en DB si el claim no es estándar.

        // Supabase suele enviar 'app_metadata: { provider: ..., providers: ... }' y 'user_metadata: { sub: ..., ... }'
        // El rol a veces viaja en 'role' (authenticated) o en app_metadata.
        // Ajustaremos esto viendo el payload real. Por ahora, asumimos user.role o user.app_metadata.role

        // Verificamos si user.role coincide
        // Nota: Un usuario puede tener múltiples roles en distintos boxes, pero aquí validamos
        // el rol "global" o el rol en el token.

        // TODO: Si necesitamos validar rol POR BOX, este guard necesitaría mirar el body/query param boxId.
        // Por simplicidad inicial (MVP), miramos si el token trae un rol específico
        // O si implementamos que el usuario "actúa como" X al loguearse.

        const userRoles = user.roles || [user.role]; // Normalizar a array

        console.log('[RolesGuard] Required roles:', requiredRoles);
        console.log('[RolesGuard] User roles:', userRoles);
        console.log('[RolesGuard] Access granted:', requiredRoles.some((role) => userRoles?.includes(role)));

        return requiredRoles.some((role) => userRoles?.includes(role));
    }
}
