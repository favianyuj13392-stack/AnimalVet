import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { KardexInventario } from '../../inventario/kardex_inventario/entities/kardex_inventario.entity';
import { LoteCaducidad } from '../../inventario/lotes_caducidad/entities/lotes_caducidad.entity';
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { Servicio } from '../../core/servicios/entities/servicio.entity';
import { CreateHospitalizacionInsumoDto } from './dto/create-hospitalizacion-insumo.dto';
import { HospitalizacionInsumo } from './entities/hospitalizacion-insumo.entity';
import { Hospitalizacion } from './entities/hospitalizacione.entity';

@Injectable()
export class HospitalizacionInsumosService {
  constructor(
    @InjectRepository(HospitalizacionInsumo)
    private readonly insumoRepo: Repository<HospitalizacionInsumo>,
    private readonly dataSource: DataSource,
  ) {}

  async registrarInsumo(dto: CreateHospitalizacionInsumoDto, usuarioId: string) {
    return this.dataSource.transaction(async (manager) => {
      const hospitalizacion = await manager.getRepository(Hospitalizacion).findOne({ where: { id: dto.id_hospitalizacion_fk } });
      if (!hospitalizacion) throw new NotFoundException('Hospitalizacion no encontrada.');
      if (hospitalizacion.estadoActual === 'Alta') {
        throw new BadRequestException('No se pueden registrar insumos en una hospitalizacion cerrada.');
      }
      if (!!dto.id_producto_fk === !!dto.id_servicio_fk) {
        throw new BadRequestException('Debe especificar un producto o un servicio, pero no ambos.');
      }

      let idProductoMapped: string | null = null;
      let idServicioMapped: number | null = null;

      if (dto.id_producto_fk) {
        await this.descontarProductoClinico(
          manager,
          dto.id_producto_fk,
          dto.cantidad,
          usuarioId,
          `Uso clinico en hospitalizacion ${dto.id_hospitalizacion_fk}`,
          hospitalizacion.id_historial_fk,
        );
        idProductoMapped = dto.id_producto_fk;
      } else if (dto.id_servicio_fk) {
        const servicio = await manager.getRepository(Servicio).findOne({ where: { id: dto.id_servicio_fk } });
        if (!servicio) throw new NotFoundException('Servicio medico no encontrado.');
        idServicioMapped = servicio.id;
      } else {
        throw new BadRequestException('Debe especificar un id_producto_fk o un id_servicio_fk.');
      }

      const nuevoInsumo = manager.getRepository(HospitalizacionInsumo).create({
        id_hospitalizacion_fk: dto.id_hospitalizacion_fk,
        id_producto_fk: idProductoMapped,
        id_servicio_fk: idServicioMapped,
        cantidad: dto.cantidad,
        notas: dto.notas ?? null,
        createdBy: usuarioId,
      });

      await manager.getRepository(HospitalizacionInsumo).save(nuevoInsumo);
      return { mensaje: 'Insumo clinico registrado correctamente y stock actualizado.' };
    });
  }

  private async descontarProductoClinico(
    manager: EntityManager,
    productoId: string,
    cantidad: number,
    usuarioId: string,
    motivo: string,
    idHistorial: string | null,
  ) {
    const productoRepo = manager.getRepository(Producto);
    const loteRepo = manager.getRepository(LoteCaducidad);
    const kardexRepo = manager.getRepository(KardexInventario);

    const producto = await productoRepo.findOne({
      where: { id: productoId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!producto) throw new NotFoundException('Producto de inventario no encontrado.');
    if (Number(producto.stockActual) < cantidad) {
      throw new ConflictException(`Stock insuficiente de [${producto.nombre}]. Disponible: ${producto.stockActual}`);
    }

    const lotes = await loteRepo.find({
      where: { idProductoFk: producto.id },
      order: { fechaVencimiento: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
    let pendiente = cantidad;
    let loteKardex: string | null = null;
    for (const lote of lotes) {
      if (pendiente <= 0) break;
      const disponible = Number(lote.cantidadActual);
      if (disponible <= 0) continue;
      const usar = Math.min(disponible, pendiente);
      lote.cantidadActual = disponible - usar;
      lote.updatedBy = usuarioId;
      await loteRepo.save(lote);
      loteKardex = loteKardex ?? lote.id;
      pendiente -= usar;
    }

    producto.stockActual = Number(producto.stockActual) - cantidad;
    producto.updatedBy = usuarioId;
    await productoRepo.save(producto);

    await kardexRepo.save(kardexRepo.create({
      idProductoFk: producto.id,
      idUsuarioFk: usuarioId,
      tipoMovimiento: 'Salida_Clinica',
      cantidad,
      saldoResultante: producto.stockActual,
      motivoDetalle: motivo,
      idLoteFk: loteKardex,
      idHistorialFk: idHistorial,
      createdBy: usuarioId,
    }));
  }
}
