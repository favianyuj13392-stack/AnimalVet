import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaProducto } from './entities/categoria_producto.entity';
import { CreateCategoriaProductoDto } from './dto/create-categorias_producto.dto';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';

@Injectable()
export class CategoriasProductoService extends BaseCrudService<CategoriaProducto> {
  constructor(
    @InjectRepository(CategoriaProducto)
    private readonly categoriaRepository: Repository<CategoriaProducto>,
  ) {
    super(categoriaRepository, 'Categoría de Producto');
  }

  // Validación de duplicados al crear
  async createCategoria(createCategoriaDto: CreateCategoriaProductoDto) {
    return super.create(createCategoriaDto, { key: 'nombre' as keyof CategoriaProducto, value: createCategoriaDto.nombre });
  }
}