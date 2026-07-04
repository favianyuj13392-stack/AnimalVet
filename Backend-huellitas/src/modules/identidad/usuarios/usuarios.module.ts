import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController, VeterinariosPublicoController } from './usuarios.controller';
import { Usuario } from './entities/usuario.entity';
import { LogsSistemaModule } from '../../core/logs_sistema/logs_sistema.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario]), LogsSistemaModule],
  controllers: [UsuariosController, VeterinariosPublicoController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}