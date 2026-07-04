import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HorarioAtencion } from './entities/horarios_atencion.entity';
import { FechaBloqueada } from './entities/fechas_bloqueadas.entity';
import { HorariosAtencionService } from './horarios_atencion.service';
import { HorariosAtencionController } from './horarios_atencion.controller';
import { Cita } from '../citas/entities/cita.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HorarioAtencion, Cita, FechaBloqueada])],
  controllers: [HorariosAtencionController],
  providers: [HorariosAtencionService],
  exports: [HorariosAtencionService],
})
export class HorariosAtencionModule {}
