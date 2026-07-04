import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RegistroEscaneoQR } from './entities/registro_escaneos_qr.entity';
import { Mascota } from '../../identidad/mascotas/entities/mascota.entity';
import { RegistroNotificacion } from '../registro_notificaciones/entities/registro_notificacione.entity';
import { RegistroEscaneoQRService } from './registro_escaneos_qr.service';
import { RegistroEscaneoQRController, RegistroEscaneoQRPublicoController } from './registro_escaneos_qr.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroEscaneoQR, Mascota, RegistroNotificacion])],
  controllers: [RegistroEscaneoQRController, RegistroEscaneoQRPublicoController],
  providers: [RegistroEscaneoQRService],
  exports: [RegistroEscaneoQRService],
})
export class RegistroEscaneoQRModule {}
