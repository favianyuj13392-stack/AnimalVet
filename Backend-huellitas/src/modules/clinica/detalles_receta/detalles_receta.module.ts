// src/modules/clinica/detalles_receta/detalles_receta.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetallesReceta } from './entities/detalles_receta.entity';
import { Receta } from '../recetas/entities/receta.entity';
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { DetallesRecetaService } from './detalles_receta.service';
import { DetallesRecetaController } from './detalles_receta.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DetallesReceta, Receta, Producto])],
  controllers: [DetallesRecetaController],
  providers: [DetallesRecetaService],
  exports: [DetallesRecetaService],
})
export class DetallesRecetaModule {}