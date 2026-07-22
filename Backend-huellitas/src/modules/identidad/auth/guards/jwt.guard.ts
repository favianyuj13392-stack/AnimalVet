import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenBlacklistService } from '../token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Si el endpoint tiene @Public(), dejar pasar sin token
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 🛡️ INTERRUPTOR MAESTRO: ¿Está activado el Modo Dios en el .env?
    // Only activates if there's no real Authorization header (preserves real user sessions)
    if (process.env.MODO_DIOS === 'true' && process.env.NODE_ENV !== 'production') {
      const request = context.switchToHttp().getRequest();
      const hasRealToken = request.headers['authorization']?.startsWith('Bearer ');
      if (!hasRealToken) {
        request.user = {
          id: 'd4576ec1-15f4-4ca7-8cd5-6a0fb39f321d',
          email: 'admin@huellitas.local',
          rol: 'Administrador',
        };
        return true;
      }
    }

    // Verificar blacklist usando método estático — sin necesidad de DI
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (TokenBlacklistService.check(token)) {
        throw new UnauthorizedException('La sesión ha sido cerrada. Inicia sesión nuevamente.');
      }
    }

    return super.canActivate(context);
  }
}
