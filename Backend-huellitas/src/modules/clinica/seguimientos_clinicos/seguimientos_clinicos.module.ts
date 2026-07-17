import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeguimientoClinico } from './entities/seguimiento-clinico.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { Receta } from '../recetas/entities/receta.entity';
import { DetallesReceta } from '../detalles_receta/entities/detalles_receta.entity';
import { SeguimientosClinicosService } from './seguimientos_clinicos.service';
import { SeguimientosClinicosController } from './seguimientos_clinicos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SeguimientoClinico,
      HistorialClinico,
      Receta,
      DetallesReceta,
    ]),
  ],
  controllers: [SeguimientosClinicosController],
  providers: [SeguimientosClinicosService],
  exports: [SeguimientosClinicosService],
})
export class SeguimientosClinicosModule {}
