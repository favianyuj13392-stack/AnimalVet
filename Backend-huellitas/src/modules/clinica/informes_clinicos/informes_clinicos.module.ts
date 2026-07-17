import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformeClinico } from './entities/informe-clinico.entity';
import { Mascota } from '../../identidad/mascotas/entities/mascota.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { ExamenSolicitado } from '../examenes_solicitados/entities/examen-solicitado.entity';
import { ConfiguracionClinica } from '../../core/configuracion_clinica/entities/configuracion_clinica.entity';
import { InformesClinicosService } from './informes_clinicos.service';
import { InformesClinicosController } from './informes_clinicos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InformeClinico,
      Mascota,
      HistorialClinico,
      ExamenSolicitado,
      ConfiguracionClinica,
    ]),
  ],
  controllers: [InformesClinicosController],
  providers: [InformesClinicosService],
  exports: [InformesClinicosService],
})
export class InformesClinicosModule {}
