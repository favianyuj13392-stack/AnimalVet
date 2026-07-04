import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';

import { CierreCaja } from './entities/cierres_caja.entity';
import { CreateCierresCajaDto } from './dto/create-cierres_caja.dto';
import { TransaccionCaja } from '../transacciones_caja/entities/transacciones_caja.entity';
import { LogsSistemaService } from '../../core/logs_sistema/logs_sistema.service';

@Injectable()
export class CierresCajaService {
  constructor(
    @InjectRepository(CierreCaja)
    private readonly cierreRepository: Repository<CierreCaja>,
    @InjectRepository(TransaccionCaja)
    private readonly transaccionRepository: Repository<TransaccionCaja>,
    private readonly logsService: LogsSistemaService,
  ) {}

  async create(dto: CreateCierresCajaDto, usuarioId: string): Promise<CierreCaja> {
    const fecha = dto.fecha_turno;

    // Si ya existe un cierre para ese slot, eliminarlo para recalcular con datos actualizados
    const existente = await this.cierreRepository.findOne({
      where: {
        id_cajero_fk: dto.id_cajero_fk,
        fecha_turno: new Date(fecha + 'T12:00:00'),
        turno: dto.turno,
      },
    });
    if (existente) {
      await this.cierreRepository.delete(existente.id);
    }

    const { inicio, fin } = this.getBoliviaDayRange(fecha);

    // Buscar transacciones del turno indicado + las que no tienen turno asignado
    const transacciones = await this.transaccionRepository.find({
      where: [
        {
          id_cajero_fk: dto.id_cajero_fk,
          turno: dto.turno === 'Completo' ? undefined : dto.turno,
          estadoTransaccion: 'Completada',
          fechaTransaccion: Between(inicio, fin),
        },
        ...(dto.turno !== 'Completo' ? [{
          id_cajero_fk: dto.id_cajero_fk,
          turno: IsNull(),
          estadoTransaccion: 'Completada',
          fechaTransaccion: Between(inicio, fin),
        }] : []),
      ],
    });

    if (transacciones.length === 0) {
      throw new BadRequestException('No hay transacciones completadas para cerrar en ese rango.');
    }

    const resumen = transacciones.reduce(
      (acc, tx) => {
        acc.total_transacciones += 1;
        acc.total_descuentos += Number(tx.descuento);
        acc.total_general += Number(tx.totalCobrado);
        if (tx.metodoPago === 'Efectivo') acc.total_efectivo += Number(tx.totalCobrado);
        if (tx.metodoPago === 'QR_Transferencia') acc.total_qr += Number(tx.totalCobrado);
        if (tx.metodoPago === 'Tarjeta') acc.total_tarjeta += Number(tx.totalCobrado);
        return acc;
      },
      {
        total_transacciones: 0,
        total_efectivo: 0,
        total_qr: 0,
        total_tarjeta: 0,
        total_descuentos: 0,
        total_general: 0,
      },
    );

    const cierre = this.cierreRepository.create({
      id_cajero_fk: dto.id_cajero_fk,
      fecha_turno: new Date(fecha + 'T12:00:00'),
      turno: dto.turno,
      ...this.roundResumen(resumen),
      observaciones: dto.observaciones,
      createdBy: usuarioId,
    });

    const cierreGuardado = await this.cierreRepository.save(cierre);

    await this.logsService.registrar({
      usuarioId,
      accion: 'CIERRE_CAJA',
      categoria: 'FINANZAS',
      tablaAfectada: 'cierres_caja',
      registroId: cierreGuardado.id,
      detalles: {
        cajero_id: dto.id_cajero_fk,
        fecha_turno: fecha,
        turno: dto.turno,
        total_transacciones: resumen.total_transacciones,
        total_general: resumen.total_general,
      },
    });

    return cierreGuardado;
  }

  findAll(): Promise<CierreCaja[]> {
    return this.cierreRepository.find({
      relations: ['cajero', 'createdByUser'],
      order: { cerrado_en: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CierreCaja> {
    const cierre = await this.cierreRepository.findOne({
      where: { id },
      relations: ['cajero', 'createdByUser'],
    });
    if (!cierre) {
      throw new NotFoundException('El cierre de caja no existe.');
    }
    return cierre;
  }

  update(): never {
    throw new BadRequestException('Los cierres de caja son inmutables.');
  }

  remove(): never {
    throw new BadRequestException('Los cierres de caja son inmutables.');
  }

  private getBoliviaDayRange(fecha: string): { inicio: Date; fin: Date } {
    return {
      inicio: new Date(`${fecha}T00:00:00.000-04:00`),
      fin: new Date(`${fecha}T23:59:59.999-04:00`),
    };
  }

  private roundResumen<T extends Record<string, number>>(resumen: T): T {
    for (const key of Object.keys(resumen)) {
      if (key !== 'total_transacciones') {
        resumen[key as keyof T] = (Math.round((resumen[key] + Number.EPSILON) * 100) / 100) as T[keyof T];
      }
    }
    return resumen;
  }
}
