import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VacunaAplicada } from './entities/vacunas_aplicada.entity';
import { CatalogoVacuna } from '../../core/catalogo_vacunas/entities/catalogo_vacuna.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { VacunasAplicadasService } from './vacunas_aplicadas.service';
import { VacunasAplicadasController } from './vacunas_aplicadas.controller';
// 👇 Nuevas importaciones
import { Hospitalizacion } from '../hospitalizaciones/entities/hospitalizacione.entity';
import { Producto } from '../../inventario/productos/entities/producto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VacunaAplicada, 
      CatalogoVacuna, 
      HistorialClinico,
      Hospitalizacion, // 👈 Añadido
      Producto         // 👈 Añadido
    ])
  ],
  controllers: [VacunasAplicadasController],
  providers: [VacunasAplicadasService],
  exports: [VacunasAplicadasService],
})
export class VacunasAplicadasModule {}