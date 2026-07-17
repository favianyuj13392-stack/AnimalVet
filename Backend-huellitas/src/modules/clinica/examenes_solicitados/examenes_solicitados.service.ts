import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamenSolicitado, EstadoExamenSolicitado } from './entities/examen-solicitado.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { CreateExamenSolicitadoDto } from './dto/create-examen-solicitado.dto';

@Injectable()
export class ExamenesSolicitadosService {
  constructor(
    @InjectRepository(ExamenSolicitado)
    private readonly examenRepo: Repository<ExamenSolicitado>,
    @InjectRepository(HistorialClinico)
    private readonly historialRepo: Repository<HistorialClinico>,
  ) {}

  async crear(dto: CreateExamenSolicitadoDto, usuarioId: string): Promise<any> {
    const historial = await this.historialRepo.findOne({
      where: { id: dto.id_historial_fk },
    });
    if (!historial) throw new NotFoundException('La consulta clínica de origen no existe.');

    const nuevo = this.examenRepo.create({
      idHistorialFk: dto.id_historial_fk,
      tipo: dto.tipo,
      estado: dto.estado || EstadoExamenSolicitado.SOLICITADO,
      createdBy: usuarioId,
      updatedBy: usuarioId,
    });

    const guardado = await this.examenRepo.save(nuevo);
    return this.mapToDto(guardado);
  }

  async listarPorConsulta(idHistorial: string): Promise<any[]> {
    const lista = await this.examenRepo.find({
      where: { idHistorialFk: idHistorial },
      relations: ['informe'],
      order: { fechaSolicitud: 'ASC' },
    });
    return lista.map((e) => this.mapToDto(e));
  }

  async cambiarEstado(id: string, estado: EstadoExamenSolicitado, usuarioId: string): Promise<any> {
    const examen = await this.examenRepo.findOne({ where: { id } });
    if (!examen) throw new NotFoundException('El examen solicitado no existe.');

    examen.estado = estado;
    if (estado === EstadoExamenSolicitado.REALIZADO) {
      examen.fechaRealizacion = new Date();
    }
    examen.updatedBy = usuarioId;

    const guardado = await this.examenRepo.save(examen);
    return this.mapToDto(guardado);
  }

  private mapToDto(e: ExamenSolicitado): any {
    return {
      id: e.id,
      id_historial_fk: e.idHistorialFk,
      tipo: e.tipo,
      estado: e.estado,
      fecha_solicitud: e.fechaSolicitud,
      fecha_realizacion: e.fechaRealizacion,
      informe_id: e.informeId,
    };
  }
}
