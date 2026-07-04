import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Tus módulos de negocio
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';

// Tu infraestructura
import { MyConfigModule } from '../../../infraestructura/config/config.module';
import { MyJwtConfig } from '../../../infraestructura/config/services/jwt.config';
import { LogsSistemaModule } from '../../core/logs_sistema/logs_sistema.module';
import { MensajeroModule } from '../../comunicacion/mensajero/mensajero.module';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
  imports: [
    UsuariosModule,
    LogsSistemaModule,
    MensajeroModule,
    TypeOrmModule.forFeature([Usuario]),
    PassportModule.register({ defaultStrategy: 'jwt' }),

    MyConfigModule,

    JwtModule.registerAsync({
      imports: [MyConfigModule],
      inject: [MyJwtConfig],
      useFactory: (jwtConfig: MyJwtConfig) => {
        const config = jwtConfig.get();

        return {
          secret: config.secret,
          signOptions: {
            // 👇 SOLUCIÓN TIPADA CORRECTA
            expiresIn: config.expiresIn as JwtSignOptions['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenBlacklistService],
  exports: [JwtModule, PassportModule, JwtStrategy, TokenBlacklistService],
})
export class AuthModule {}