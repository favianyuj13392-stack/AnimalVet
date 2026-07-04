import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 🛡️ INTERRUPTOR MAESTRO: Si está en Modo Dios, no hacemos preguntas
    if (process.env.MODO_DIOS === 'true' && process.env.NODE_ENV !== 'production') {
      return true;
    }

    // --- A PARTIR DE AQUÍ ES LA SEGURIDAD REAL (Cuando MODO_DIOS es false) ---

    // 1. Mirar qué roles exige esta ruta
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene el decorador @Roles, dejamos pasar
    if (!rolesRequeridos) {
      return true;
    }

    // 2. Obtener el usuario del request (inyectado previamente por JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.rol) {
      throw new ForbiddenException('No se encontró el rol del usuario en la petición.');
    }

    // 3. Verificar si el rol del usuario está en la lista de permitidos
    const tienePermiso = rolesRequeridos.includes(user.rol);
    
    if (!tienePermiso) {
      throw new ForbiddenException(`Acceso denegado. Se requiere uno de los siguientes roles: ${rolesRequeridos.join(', ')}`);
    }

    return true;
  }
}
