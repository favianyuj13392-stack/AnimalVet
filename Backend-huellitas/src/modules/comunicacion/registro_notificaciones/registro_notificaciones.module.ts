import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroNotificacion } from './entities/registro_notificacione.entity';
import { RegistroNotificacionesService } from './registro_notificaciones.service';
import { RegistroNotificacionesController } from './registro_notificaciones.controller';
import { MensajeroModule } from '../mensajero/mensajero.module';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroNotificacion]), MensajeroModule],
  controllers: [RegistroNotificacionesController],
  providers: [RegistroNotificacionesService],
  exports: [RegistroNotificacionesService],
})
export class RegistroNotificacionesModule {}
