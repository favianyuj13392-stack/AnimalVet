import { Injectable} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
// Ajusta esta ruta a donde tengas exactamente tu MyJwtConfig
import { MyJwtConfig } from '../../../../infraestructura/config/services/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly jwtConfig: MyJwtConfig) {
    // Le pasamos la configuración a Passport
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rechaza tokens expirados (RF-01)
      secretOrKey: jwtConfig.get().secret, 
    });
  }

  // Si Passport valida el token exitosamente, ejecuta este método.
  // El "payload" es lo que guardamos en el token cuando el usuario hizo login.
  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(payload: any) {
    // Lo que retornemos aquí se inyectará mágicamente en `request.user`
    // y será lo que lea nuestro decorador @CurrentUser()
    return { 
      id: payload.sub, 
      email: payload.email, 
      rol: payload.rol 
    };
  }
}