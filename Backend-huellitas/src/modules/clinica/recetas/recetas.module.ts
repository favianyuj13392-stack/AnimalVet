// src/modules/clinica/recetas/recetas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receta } from './entities/receta.entity';
import { DetallesReceta } from '../detalles_receta/entities/detalles_receta.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { Usuario } from '../../identidad/usuarios/entities/usuario.entity';
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { ConfiguracionClinica } from '../../core/configuracion_clinica/entities/configuracion_clinica.entity';
import { RecetasService } from './recetas.service';
import { RecetasController } from './recetas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receta, DetallesReceta, HistorialClinico, Usuario, Producto, ConfiguracionClinica]),
  ],
  controllers: [RecetasController],
  providers: [RecetasService],
  exports: [RecetasService],
})
export class RecetasModule {}