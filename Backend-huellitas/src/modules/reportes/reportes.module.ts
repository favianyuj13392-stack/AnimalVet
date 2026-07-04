import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { TransaccionCaja } from '../caja/transacciones_caja/entities/transacciones_caja.entity';
import { Cita } from '../clinica/citas/entities/cita.entity';
import { Producto } from '../inventario/productos/entities/producto.entity';
import { LoteCaducidad } from '../inventario/lotes_caducidad/entities/lotes_caducidad.entity';
import { VacunaAplicada } from '../clinica/vacunas_aplicadas/entities/vacunas_aplicada.entity';
import { Mascota } from '../identidad/mascotas/entities/mascota.entity';
import { CierreCaja } from '../caja/cierres_caja/entities/cierres_caja.entity';
import { HistorialClinico } from '../clinica/historial_clinico/entities/historial_clinico.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransaccionCaja,
      Cita,
      Producto,
      LoteCaducidad,
      VacunaAplicada,
      Mascota,
      CierreCaja,
      HistorialClinico,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}
