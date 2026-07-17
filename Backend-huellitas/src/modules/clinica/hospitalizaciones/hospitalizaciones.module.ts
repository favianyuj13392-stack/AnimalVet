import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospitalizacion } from './entities/hospitalizacione.entity';
import { HospitalizacionesService } from './hospitalizaciones.service';
import { HospitalizacionesController } from './hospitalizaciones.controller';
// 👇 Nuevas importaciones
import { HospitalizacionInsumo } from './entities/hospitalizacion-insumo.entity';
import { HospitalizacionInsumosService } from './hospitalizacion-insumos.service';
import { HospitalizacionInsumosController } from './hospitalizacion-insumos.controller';
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { Servicio } from '../../core/servicios/entities/servicio.entity';

import { HospitalizacionTratamientoMonitoreo } from './entities/hospitalizacion-tratamiento-monitoreo.entity';
import { HospitalizacionAlimentacion } from './entities/hospitalizacion-alimentacion.entity';
import { HospitalizacionArticulo } from './entities/hospitalizacion-articulo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hospitalizacion,
      HospitalizacionInsumo, // 👈 Añadido
      Producto,              // 👈 Añadido
      Servicio,              // 👈 Añadido
      HospitalizacionTratamientoMonitoreo,
      HospitalizacionAlimentacion,
      HospitalizacionArticulo,
    ])
  ],
  controllers: [
    HospitalizacionesController,
    HospitalizacionInsumosController // 👈 Añadido
  ],
  providers: [
    HospitalizacionesService,
    HospitalizacionInsumosService    // 👈 Añadido
  ],
})
export class HospitalizacionesModule {}