import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriasProductoService } from './categorias_productos.service';
import { CategoriasProductoController } from './categorias_productos.controller';
import { CategoriaProducto } from './entities/categoria_producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaProducto])],
  controllers: [CategoriasProductoController],
  providers: [CategoriasProductoService],
  exports: [CategoriasProductoService], // Lo usaremos en la Fase 4 para el Inventario
})
export class CategoriasProductoModule {}