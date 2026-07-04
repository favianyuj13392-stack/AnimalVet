import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleTransaccion } from './entities/detalles_transaccion.entity';

@Injectable()
export class DetallesTransaccionService {
  constructor(
    @InjectRepository(DetalleTransaccion)
    private readonly detalleRepo: Repository<DetalleTransaccion>,
  ) {}

  findAll(): Promise<DetalleTransaccion[]> {
    return this.detalleRepo.find({
      relations: ['transaccion', 'producto', 'servicio', 'receta', 'lote'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DetalleTransaccion> {
    const detalle = await this.detalleRepo.findOne({
      where: { id },
      relations: ['transaccion', 'producto', 'servicio', 'receta', 'lote'],
    });
    if (!detalle) {
      throw new NotFoundException('El detalle de transaccion no existe.');
    }
    return detalle;
  }

  create(): never {
    throw new BadRequestException('Los detalles se crean desde el punto de venta para mantener atomicidad.');
  }

  update(): never {
    throw new BadRequestException('Los detalles de transaccion son inmutables.');
  }

  remove(): never {
    throw new BadRequestException('Los detalles de transaccion no se eliminan.');
  }
}
