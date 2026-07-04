import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArchivoAdjunto } from './entities/archivos_adjunto.entity';
import { CreateArchivoAdjuntoDto } from './dto/create-archivos_adjunto.dto';
import { UpdateArchivosAdjuntoDto } from './dto/update-archivos_adjunto.dto';
import { ArchivosAdjuntosResponseDto } from './dto/archivos_adjuntos-response.dto';

@Injectable()
export class ArchivosAdjuntosService {
  constructor(
    @InjectRepository(ArchivoAdjunto)
    private readonly archivoRepo: Repository<ArchivoAdjunto>,
  ) {}

  private mapToResponse(a: ArchivoAdjunto): ArchivosAdjuntosResponseDto {
    return {
      id: a.id,
id_historial_fk: a.id_historial_fk ?? undefined,
      id_hospitalizacion_fk: a.id_hospitalizacion_fk ?? undefined,
      url_archivo: a.urlArchivo,
      nombre_archivo: a.nombreArchivo ?? undefined,
      tipo_archivo: a.tipoArchivo,
      tipo_estudio: a.tipoEstudio,
      origen: a.origen,
      estado_archivo: a.estadoArchivo,
      fecha_estudio: a.fechaEstudio ?? undefined,
      observaciones: a.observaciones ?? undefined,
    };
  }

  private async findEntity(id: string): Promise<ArchivoAdjunto> {
    const archivo = await this.archivoRepo.findOne({
      where: { id },
      relations: ['historialClinico', 'hospitalizacion'],
    });
    if (!archivo) {
      throw new NotFoundException(`Archivo adjunto con ID ${id} no encontrado.`);
    }
    return archivo;
  }

  /**
   * Registrar un nuevo archivo adjunto a un historial clínico
   */
  async create(createDto: CreateArchivoAdjuntoDto, creatorId: string): Promise<ArchivosAdjuntosResponseDto> {
    const tieneHistorial = !!createDto.id_historial_fk;
    const tieneHospitalizacion = !!createDto.id_hospitalizacion_fk;
    if (tieneHistorial === tieneHospitalizacion) {
      throw new BadRequestException('El archivo debe pertenecer a un historial o a una hospitalizacion, pero no a ambos.');
    }

    const nuevoArchivo = this.archivoRepo.create({
id_historial_fk: createDto.id_historial_fk || null,           // 👈 MANEJAR NULOS
      id_hospitalizacion_fk: createDto.id_hospitalizacion_fk || null, // 👈 NUEVO
      urlArchivo: createDto.url_archivo,
      nombreArchivo: createDto.nombre_archivo,
      tipoArchivo: createDto.tipo_archivo,
      tipoEstudio: createDto.tipo_estudio,
      origen: createDto.origen ?? 'Interno',
      estadoArchivo: createDto.estado_archivo ?? 'Recibido',
      fechaEstudio: createDto.fecha_estudio ? new Date(createDto.fecha_estudio) : null,
      observaciones: createDto.observaciones,
      createdBy: creatorId,
historialClinico: createDto.id_historial_fk ? { id: createDto.id_historial_fk } as any : null,
hospitalizacion: createDto.id_hospitalizacion_fk ? { id: createDto.id_hospitalizacion_fk } as any : null,
      createdByUser: { id: creatorId } as any,
    });

    const guardado = await this.archivoRepo.save(nuevoArchivo);
    return this.findOne(guardado.id);
  }

  /**
   * Listar todos los archivos adjuntos de un historial clínico
   */
  async findByHistorial(idHistorial: string): Promise<ArchivosAdjuntosResponseDto[]> {
    const archivos = await this.archivoRepo.find({
      where: { id_historial_fk: idHistorial },
      order: { createdAt: 'DESC' },
    });
    return archivos.map(a => this.mapToResponse(a));
  }

  /**
   * Obtener un archivo adjunto por UUID
   */
  async findOne(id: string): Promise<ArchivosAdjuntosResponseDto> {
    const entity = await this.findEntity(id);
    return this.mapToResponse(entity);
  }

  /**
   * Actualizar estado o datos del archivo adjunto
   */
  async update(id: string, updateDto: UpdateArchivosAdjuntoDto, updaterId: string): Promise<ArchivosAdjuntosResponseDto> {
    const archivo = await this.findEntity(id);

    if (updateDto.nombre_archivo !== undefined) archivo.nombreArchivo = updateDto.nombre_archivo;
    if (updateDto.tipo_estudio !== undefined) archivo.tipoEstudio = updateDto.tipo_estudio;
    if (updateDto.origen !== undefined) archivo.origen = updateDto.origen;
    if (updateDto.estado_archivo !== undefined) archivo.estadoArchivo = updateDto.estado_archivo;
    if (updateDto.observaciones !== undefined) archivo.observaciones = updateDto.observaciones;
    if (updateDto.fecha_estudio !== undefined) archivo.fechaEstudio = new Date(updateDto.fecha_estudio);
    archivo.updatedBy = updaterId;

    const guardado = await this.archivoRepo.save(archivo);
    return this.findOne(guardado.id);
  }

  /**
   * Soft delete de un archivo adjunto
   */
  async remove(id: string): Promise<{ mensaje: string }> {
    const archivo = await this.findEntity(id);
    await this.archivoRepo.softRemove(archivo);
    return { mensaje: `Archivo adjunto eliminado correctamente.` };
  }
}
