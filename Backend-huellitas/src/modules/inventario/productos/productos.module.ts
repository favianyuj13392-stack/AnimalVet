import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';

import { EnvaseAbierto } from './entities/envase_abierto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, EnvaseAbierto])],
  controllers: [ProductosController],
  providers: [ProductosService],
  exports: [ProductosService, TypeOrmModule],
})
export class ProductosModule {}
