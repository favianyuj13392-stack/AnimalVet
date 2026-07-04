import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';
import { Cita } from './entities/cita.entity';
import { HorarioAtencion } from '../horarios_atencion/entities/horarios_atencion.entity';
import { FechaBloqueada } from '../horarios_atencion/entities/fechas_bloqueadas.entity';
import { Servicio } from '../../core/servicios/entities/servicio.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { CitasGateway } from './citas.gateway';
import { LogsSistemaModule } from '../../core/logs_sistema/logs_sistema.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cita, HorarioAtencion, Servicio, FechaBloqueada, HistorialClinico]), LogsSistemaModule],
  controllers: [CitasController],
  providers: [CitasService, CitasGateway],
  exports: [CitasService, CitasGateway],
})
export class CitasModule {}
