import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from '../../clinica/citas/entities/cita.entity';
import { ConfiguracionClinica } from '../../core/configuracion_clinica/entities/configuracion_clinica.entity';
import { ReportesModule } from '../../reportes/reportes.module';
import { RegistroNotificacionesModule } from '../registro_notificaciones/registro_notificaciones.module';
import { MensajeroModule } from '../mensajero/mensajero.module';
import { NotificacionSchedulerService } from './notificacion-scheduler.service';
import { NotificacionSchedulerController } from './notificacion-scheduler.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cita, ConfiguracionClinica]),
    ReportesModule,
    RegistroNotificacionesModule,
    MensajeroModule,
  ],
  controllers: [NotificacionSchedulerController],
  providers: [NotificacionSchedulerService],
  exports: [NotificacionSchedulerService],
})
export class NotificacionSchedulerModule {}
