import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialClinico } from './entities/historial_clinico.entity';
import { HistorialClinicoService } from './historial_clinico.service';
import { HistorialClinicoController } from './historial_clinico.controller';
import { Cita } from '../citas/entities/cita.entity';
import { ExpedienteClinicoModule } from '../expediente_clinico/expediente_clinico.module';
import { ExpedienteClinico } from '../expediente_clinico/entities/expediente_clinico.entity';
import { Mascota } from '../../identidad/mascotas/entities/mascota.entity';
import { MonitoreoDiario } from '../monitoreo_diario/entities/monitoreo_diario.entity';
import { LogsSistemaModule } from '../../core/logs_sistema/logs_sistema.module';
import { CitasModule } from '../citas/citas.module';
import { MensajeroModule } from '../../comunicacion/mensajero/mensajero.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HistorialClinico, Cita, ExpedienteClinico, Mascota, MonitoreoDiario]),
    ExpedienteClinicoModule,
    LogsSistemaModule,
    CitasModule,
    MensajeroModule,
  ],
  controllers: [HistorialClinicoController],
  providers: [HistorialClinicoService],
  exports: [HistorialClinicoService],
})
export class HistorialClinicoModule {}
