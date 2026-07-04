import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetallesReceta } from './entities/detalles_receta.entity';
import { Receta } from '../recetas/entities/receta.entity';
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { CreateDetalleRecetaDto } from './dto/create-detalles_receta.dto';
import { UpdateDetalleRecetaDto } from './dto/update-detalles_receta.dto';
import { DetallesRecetaResponseDto } from './dto/detalles_receta-response.dto';

@Injectable()
export class DetallesRecetaService {
  constructor(
    @InjectRepository(DetallesReceta)
    private readonly detalleRepo: Repository<DetallesReceta>,
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
  ) {}

  private mapToResponse(detalle: DetallesReceta): DetallesRecetaResponseDto {
    return {
      id: detalle.id,
      medicamento_texto: detalle.medicamentoTexto ?? undefined,
      dosis: detalle.dosis,
      frecuencia: detalle.frecuencia,
      duracion_dias: detalle.duracionDias ?? undefined,
      producto: detalle.producto ? {
        id: detalle.producto.id,
        nombre: detalle.producto.nombre,
      } : undefined,
    };
  }

  async crear(
    idReceta: string,
    dto: CreateDetalleRecetaDto,
    creatorId: string,
    creatorRol: string,
  ): Promise<DetallesRecetaResponseDto> {
    if (!['Veterinario', 'Administrador'].includes(creatorRol)) {
      throw new ForbiddenException(
        'Solo veterinarios y administradores pueden agregar detalles a una receta.',
      );
    }

    const receta = await this.recetaRepo.findOne({
      where: { id: idReceta },
      relations: ['historial'],
    });
    if (!receta) throw new NotFoundException('Receta no encontrada.');
    if (receta.historial && (receta.historial.estado === 'Cerrado' || receta.historial.estado === 'Facturado')) {
      throw new BadRequestException('No se pueden añadir medicamentos a una receta congelada.');
    }

    // Validar check constraint: chk_medicamento_prescrito
    const tieneProducto = !!dto.id_producto;
    const tieneTexto = !!dto.medicamento_texto && dto.medicamento_texto.trim() !== '';

    if (tieneProducto && tieneTexto) {
      throw new BadRequestException(
        'No se puede especificar un producto del catálogo (id_producto) y medicamento en texto al mismo tiempo.',
      );
    }

    if (!tieneProducto && !tieneTexto) {
      throw new BadRequestException(
        'Debe especificar obligatoriamente un producto del catálogo (id_producto) o medicamento en texto.',
      );
    }

    if (dto.id_producto) {
      const producto = await this.productoRepo.findOne({
        where: { id: dto.id_producto },
      });
      if (!producto) throw new NotFoundException('Producto no encontrado.');
    }

    // Crear detalle usando columnas FK y relación de auditoría
    const nuevoDetalle = this.detalleRepo.create({
      idRecetaFk: idReceta,
      idProductoFk: dto.id_producto || null,
      medicamentoTexto: dto.medicamento_texto || null,
      dosis: dto.dosis,
      frecuencia: dto.frecuencia,
      duracionDias: dto.duracion_dias ?? null,
      createdBy: creatorId,
      createdByUser: { id: creatorId },
    } as DetallesReceta);

    const guardado = await this.detalleRepo.save(nuevoDetalle);
    return this.obtenerPorId(guardado.id);
  }

  async obtenerPorId(id: string): Promise<DetallesRecetaResponseDto> {
    const detalle = await this.detalleRepo.findOne({
      where: { id },
      relations: ['producto', 'receta'],
    });
    if (!detalle) throw new NotFoundException('Detalle no encontrado.');
    return this.mapToResponse(detalle);
  }

  async actualizar(
    id: string,
    dto: UpdateDetalleRecetaDto,
  ): Promise<DetallesRecetaResponseDto> {
    const detalle = await this.detalleRepo.findOne({
      where: { id },
      relations: ['receta', 'receta.historial'],
    });
    if (!detalle) throw new NotFoundException('Detalle no encontrado.');
    if (detalle.receta && detalle.receta.historial && (detalle.receta.historial.estado === 'Cerrado' || detalle.receta.historial.estado === 'Facturado')) {
      throw new BadRequestException('No se pueden modificar medicamentos de una receta congelada.');
    }
    
    if (dto.dosis !== undefined) detalle.dosis = dto.dosis;
    if (dto.frecuencia !== undefined) detalle.frecuencia = dto.frecuencia;
    if (dto.duracion_dias !== undefined) detalle.duracionDias = dto.duracion_dias;
    
    const guardado = await this.detalleRepo.save(detalle);
    return this.obtenerPorId(guardado.id);
  }

  async eliminar(id: string): Promise<{ mensaje: string }> {
    const detalle = await this.detalleRepo.findOne({
      where: { id },
      relations: ['receta', 'receta.historial'],
    });
    if (!detalle) throw new NotFoundException('Detalle no encontrado.');
    if (detalle.receta && detalle.receta.historial && (detalle.receta.historial.estado === 'Cerrado' || detalle.receta.historial.estado === 'Facturado')) {
      throw new BadRequestException('No se pueden modificar medicamentos de una receta congelada.');
    }
    await this.detalleRepo.softDelete(id);
    return { mensaje: 'Detalle eliminado correctamente.' };
  }
}