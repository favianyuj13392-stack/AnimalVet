import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroNotificacion } from '../registro_notificaciones/entities/registro_notificacione.entity';
import { MensajeroService } from './mensajero.service';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroNotificacion])],
  providers: [MensajeroService],
  exports: [MensajeroService],
})
export class MensajeroModule {}
