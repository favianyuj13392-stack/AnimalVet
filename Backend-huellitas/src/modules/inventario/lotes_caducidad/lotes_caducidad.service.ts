import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';
import { CreateLotesCaducidadDto } from './dto/create-lotes_caducidad.dto';
import { UpdateLotesCaducidadDto } from './dto/update-lotes_caducidad.dto';
import { LoteCaducidad } from './entities/lotes_caducidad.entity';
import { Producto } from '../productos/entities/producto.entity';
import { KardexInventario } from '../kardex_inventario/entities/kardex_inventario.entity';

@Injectable()
export class LotesCaducidadService {
  constructor(
    @InjectRepository(LoteCaducidad)
    private readonly loteRepo: Repository<LoteCaducidad>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateLotesCaducidadDto, usuarioId: string): Promise<LoteCaducidad> {
    return this.dataSource.transaction(async (manager) => {
      const productoRepo = manager.getRepository(Producto);
      const loteRepo = manager.getRepository(LoteCaducidad);
      const kardexRepo = manager.getRepository(KardexInventario);

      const producto = await productoRepo.findOne({
        where: { id: createDto.id_producto_fk },
        lock: { mode: 'pessimistic_write' },
      });
      if (!producto) {
        throw new NotFoundException('El producto del lote no existe.');
      }

      const duplicado = await loteRepo.findOne({
        where: {
          idProductoFk: createDto.id_producto_fk,
          numeroLote: createDto.numero_lote,
        },
      });
      if (duplicado) {
        throw new ConflictException('Ya existe un lote con ese numero para el producto seleccionado.');
      }

      const lote = loteRepo.create({
        idProductoFk: createDto.id_producto_fk,
        numeroLote: createDto.numero_lote,
        fechaVencimiento: new Date(createDto.fecha_vencimiento),
        cantidadInicial: createDto.cantidad_inicial,
        cantidadActual: createDto.cantidad_inicial,
        createdBy: usuarioId,
      });
      const loteGuardado = await loteRepo.save(lote);

      producto.stockActual = Number(producto.stockActual) + createDto.cantidad_inicial;
      producto.updatedBy = usuarioId;
      await productoRepo.save(producto);

      await kardexRepo.save(kardexRepo.create({
        idProductoFk: producto.id,
        idUsuarioFk: usuarioId,
        tipoMovimiento: 'Entrada',
        cantidad: createDto.cantidad_inicial,
        saldoResultante: producto.stockActual,
        motivoDetalle: `Ingreso de lote ${createDto.numero_lote}`,
        idLoteFk: loteGuardado.id,
        createdBy: usuarioId,
      }));

      return loteGuardado;
    });
  }

  async findAll(productoId?: string): Promise<LoteCaducidad[]> {
    return this.loteRepo.find({
      where: productoId ? { idProductoFk: productoId } : {},
      relations: ['producto'],
      order: { fechaVencimiento: 'ASC' },
    });
  }

  async findPorVencer(dias = 60): Promise<LoteCaducidad[]> {
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);

    return this.loteRepo.find({
      where: { fechaVencimiento: LessThanOrEqual(limite) },
      relations: ['producto'],
      order: { fechaVencimiento: 'ASC' },
    });
  }

  async findOne(id: string): Promise<LoteCaducidad> {
    const lote = await this.loteRepo.findOne({ where: { id }, relations: ['producto'] });
    if (!lote) {
      throw new NotFoundException('El lote solicitado no existe.');
    }
    return lote;
  }

  async update(id: string, updateDto: UpdateLotesCaducidadDto, usuarioId: string): Promise<LoteCaducidad> {
    const lote = await this.findOne(id);
    if (updateDto.numero_lote !== undefined) lote.numeroLote = updateDto.numero_lote;
    if (updateDto.fecha_vencimiento !== undefined) lote.fechaVencimiento = new Date(updateDto.fecha_vencimiento);
    lote.updatedBy = usuarioId;
    return this.loteRepo.save(lote);
  }

  async remove(id: string): Promise<{ mensaje: string }> {
    const lote = await this.findOne(id);
    if (Number(lote.cantidadActual) > 0) {
      throw new BadRequestException('No se puede desactivar un lote con unidades disponibles.');
    }
    await this.loteRepo.softRemove(lote);
    return { mensaje: `Lote ${lote.numeroLote} desactivado correctamente.` };
  }
}
