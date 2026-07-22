import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './entities/producto.entity';
import { EnvaseAbierto } from './entities/envase_abierto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
  ) {}

  /**
   * Crear un nuevo producto en el inventario
   */
  async create(createDto: CreateProductoDto, creatorId: string): Promise<Producto> {
    // Verificar que no exista un producto con el mismo nombre
    const existe = await this.productoRepo.findOne({ where: { nombre: createDto.nombre } });
    if (existe) {
      throw new ConflictException(`Ya existe un producto con el nombre: '${createDto.nombre}'`);
    }

    const nuevoProducto = this.productoRepo.create({
      nombre: createDto.nombre,
      descripcion: createDto.descripcion,
      unidadMedida: createDto.unidad_medida,
      requiereReceta: createDto.requiere_receta ?? false,
      precioVenta: createDto.precio_venta,
      stockActual: createDto.stock_actual ?? 0,
      stockMinimo: createDto.stock_minimo ?? 5,
      categoria: { id: createDto.id_categoria_fk },
      createdBy: creatorId,
      ...(createDto.imagen_url ? { imagen_url: createDto.imagen_url } : {}),
    });

    return this.productoRepo.save(nuevoProducto);
  }

  /**
   * Listar todos los productos activos con su categoría
   */
  async findAll(): Promise<any[]> {
    const productos = await this.productoRepo.find({
      relations: ['categoria'],
      order: { nombre: 'ASC' },
    });

    const envaseRepo = this.productoRepo.manager.getRepository(EnvaseAbierto);
    const res: any[] = [];
    for (const p of productos) {
      let volumenRestanteOpen: number | null = null;
      if (p.tipoProducto === 'Multidosis') {
        const envase = await envaseRepo.findOne({
          where: { idProductoFk: p.id, estado: 'Abierto' }
        });
        if (envase) {
          volumenRestanteOpen = Number(envase.volumenRestante);
        }
      }
      res.push({
        ...p,
        volumenRestanteOpen
      });
    }
    return res;
  }

  async findAllPaginated(page: number, limit: number, buscar: string, categoria: string): Promise<any> {
    const qb = this.productoRepo.createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .orderBy('producto.nombre', 'ASC');

    if (buscar) {
      qb.andWhere('(LOWER(producto.nombre) LIKE LOWER(:buscar) OR LOWER(producto.id) LIKE LOWER(:buscar))', { buscar: `%${buscar}%` });
    }

    if (categoria && categoria !== 'todas') {
      qb.andWhere('categoria.nombre = :categoria', { categoria });
    }

    const [productos, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const envaseRepo = this.productoRepo.manager.getRepository(EnvaseAbierto);
    const res: any[] = [];
    for (const p of productos) {
      let volumenRestanteOpen: number | null = null;
      if (p.tipoProducto === 'Multidosis') {
        const envase = await envaseRepo.findOne({
          where: { idProductoFk: p.id, estado: 'Abierto' }
        });
        if (envase) {
          volumenRestanteOpen = Number(envase.volumenRestante);
        }
      }
      res.push({
        ...p,
        volumenRestanteOpen
      });
    }

    return {
      data: res,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findStockCritico(): Promise<Producto[]> {
    return this.productoRepo
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.categoria', 'categoria')
      .where('producto.stock_actual <= producto.stock_minimo')
      .orderBy('producto.nombre', 'ASC')
      .getMany();
  }

  /**
   * Obtener un producto por su UUID
   */
  async findOne(id: string): Promise<Producto> {
    const producto = await this.productoRepo.findOne({
      where: { id },
      relations: ['categoria'],
    });
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado.`);
    }
    return producto;
  }

  /**
   * Actualizar datos de un producto
   */
  async update(id: string, updateDto: UpdateProductoDto, updaterId: string): Promise<Producto> {
    const producto = await this.findOne(id);

    if (updateDto.nombre && updateDto.nombre !== producto.nombre) {
      const existe = await this.productoRepo.findOne({ where: { nombre: updateDto.nombre } });
      if (existe) {
        throw new ConflictException(`Ya existe un producto con el nombre: '${updateDto.nombre}'`);
      }
    }

    if (updateDto.nombre !== undefined) producto.nombre = updateDto.nombre;
    if (updateDto.descripcion !== undefined) producto.descripcion = updateDto.descripcion;
    if (updateDto.unidad_medida !== undefined) producto.unidadMedida = updateDto.unidad_medida;
    if (updateDto.requiere_receta !== undefined) producto.requiereReceta = updateDto.requiere_receta;
    if (updateDto.precio_venta !== undefined) producto.precioVenta = updateDto.precio_venta;
    if (updateDto.stock_actual !== undefined) producto.stockActual = updateDto.stock_actual;
    if (updateDto.stock_minimo !== undefined) producto.stockMinimo = updateDto.stock_minimo;
    if (updateDto.id_categoria_fk !== undefined) {
      (producto as any).categoria = { id: updateDto.id_categoria_fk };
    }
    if (updateDto.imagen_url !== undefined) producto.imagen_url = updateDto.imagen_url;
    producto.updatedBy = updaterId;

    return this.productoRepo.save(producto);
  }

  /**
   * Soft delete de un producto (lo desactiva, no lo borra)
   */
  async remove(id: string): Promise<{ mensaje: string }> {
    const producto = await this.findOne(id);
    await this.productoRepo.softRemove(producto);
    return { mensaje: `Producto '${producto.nombre}' desactivado correctamente.` };
  }
}
