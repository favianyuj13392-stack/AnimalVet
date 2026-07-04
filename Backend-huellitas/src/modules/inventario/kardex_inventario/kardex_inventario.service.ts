import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateKardexInventarioDto } from './dto/create-kardex_inventario.dto';
import { KardexInventario } from './entities/kardex_inventario.entity';
import { Producto } from '../productos/entities/producto.entity';
import { LoteCaducidad } from '../lotes_caducidad/entities/lotes_caducidad.entity';
import { LogsSistemaService } from '../../core/logs_sistema/logs_sistema.service';

@Injectable()
export class KardexInventarioService {
  constructor(
    @InjectRepository(KardexInventario)
    private readonly kardexRepo: Repository<KardexInventario>,
    private readonly dataSource: DataSource,
    private readonly logsService: LogsSistemaService,
  ) {}

  async create(createDto: CreateKardexInventarioDto, usuarioId: string): Promise<KardexInventario> {
    if (['Merma', 'Salida_Clinica', 'Ajuste'].includes(createDto.tipo_movimiento) && !createDto.motivo_detalle?.trim()) {
      throw new BadRequestException('El motivo es obligatorio para mermas, uso clinico o ajustes.');
    }

    return this.dataSource.transaction(async (manager) => {
      const productoRepo = manager.getRepository(Producto);
      const loteRepo = manager.getRepository(LoteCaducidad);
      const kardexRepo = manager.getRepository(KardexInventario);

      const producto = await productoRepo.findOne({
        where: { id: createDto.id_producto_fk },
        lock: { mode: 'pessimistic_write' },
      });
      if (!producto) {
        throw new NotFoundException('El producto del movimiento no existe.');
      }

      const esSalida = ['Salida_Venta', 'Merma', 'Salida_Clinica'].includes(createDto.tipo_movimiento);
      const delta = esSalida ? -createDto.cantidad : createDto.cantidad;
      if (Number(producto.stockActual) + delta < 0) {
        throw new BadRequestException('Stock insuficiente para registrar el movimiento.');
      }

      let loteId = createDto.id_lote_fk ?? null;
      if (loteId) {
        const lote = await loteRepo.findOne({
          where: { id: loteId, idProductoFk: producto.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!lote) {
          throw new NotFoundException('El lote seleccionado no existe para este producto.');
        }
        if (Number(lote.cantidadActual) + delta < 0) {
          throw new BadRequestException('Stock insuficiente en el lote seleccionado.');
        }
        lote.cantidadActual = Number(lote.cantidadActual) + delta;
        lote.updatedBy = usuarioId;
        await loteRepo.save(lote);
      }

      producto.stockActual = Number(producto.stockActual) + delta;
      producto.updatedBy = usuarioId;
      await productoRepo.save(producto);

      const movimiento = await kardexRepo.save(kardexRepo.create({
        idProductoFk: producto.id,
        idUsuarioFk: createDto.id_usuario_fk ?? usuarioId,
        tipoMovimiento: createDto.tipo_movimiento,
        cantidad: createDto.cantidad,
        saldoResultante: producto.stockActual,
        motivoDetalle: createDto.motivo_detalle,
        idLoteFk: loteId,
        idTransaccionFk: createDto.id_transaccion_fk ?? null,
        idHistorialFk: createDto.id_historial_fk ?? null,
        createdBy: usuarioId,
      }));

      await this.logsService.registrar({
        usuarioId,
        accion: 'MOVIMIENTO_KARDEX',
        categoria: 'INVENTARIO',
        tablaAfectada: 'kardex_inventario',
        registroId: movimiento.id,
        detalles: {
          producto: producto.nombre,
          tipo_movimiento: createDto.tipo_movimiento,
          cantidad: createDto.cantidad,
          saldo_resultante: producto.stockActual,
          motivo: createDto.motivo_detalle ?? null,
        },
      });

      return movimiento;
    });
  }

  private mapToResponse(k: KardexInventario) {
    return {
      id:              k.id,
      tipo_movimiento: k.tipoMovimiento,
      cantidad:        k.cantidad,
      saldo_resultante: k.saldoResultante,
      motivo_detalle:  k.motivoDetalle ?? null,
      id_producto_fk:  k.idProductoFk,
      id_usuario_fk:   k.idUsuarioFk,
      id_lote_fk:      k.idLoteFk ?? null,
      id_transaccion_fk: k.idTransaccionFk ?? null,
      id_historial_fk: k.idHistorialFk ?? null,
      createdBy:       k.createdBy,
      createdAt:       k.createdAt,
      producto: k.producto ? {
        id:     k.producto.id,
        nombre: k.producto.nombre,
      } : undefined,
    };
  }

  async findAll(productoId?: string): Promise<any[]> {
    const movimientos = await this.kardexRepo.find({
      where: productoId ? { idProductoFk: productoId } : {},
      relations: ['producto', 'lote', 'usuario'],
      order: { createdAt: 'DESC' },
    });
    return movimientos.map(m => this.mapToResponse(m));
  }

  async findOne(id: string): Promise<any> {
    const movimiento = await this.kardexRepo.findOne({
      where: { id },
      relations: ['producto', 'lote', 'usuario', 'transaccion', 'historial'],
    });
    if (!movimiento) {
      throw new NotFoundException('El movimiento de kardex no existe.');
    }
    return this.mapToResponse(movimiento);
  }

  update(): never {
    throw new BadRequestException('El kardex es inmutable: no se puede modificar un movimiento.');
  }

  remove(): never {
    throw new BadRequestException('El kardex es inmutable: no se puede eliminar un movimiento.');
  }
}
