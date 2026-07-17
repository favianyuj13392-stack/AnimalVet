import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SeguimientoClinico } from './entities/seguimiento-clinico.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { Receta } from '../recetas/entities/receta.entity';
import { DetallesReceta } from '../detalles_receta/entities/detalles_receta.entity';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';

@Injectable()
export class SeguimientosClinicosService {
  constructor(
    @InjectRepository(SeguimientoClinico)
    private readonly seguimientoRepo: Repository<SeguimientoClinico>,
    @InjectRepository(HistorialClinico)
    private readonly historialRepo: Repository<HistorialClinico>,
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,
    @InjectRepository(DetallesReceta)
    private readonly detalleRepo: Repository<DetallesReceta>,
    private readonly dataSource: DataSource,
  ) {}

  async crear(dto: CreateSeguimientoDto, usuarioId: string): Promise<any> {
    // 1. Validar que la consulta exista y esté FINALIZADA
    const historial = await this.historialRepo.findOne({
      where: { id: dto.id_historial_clinico_fk },
    });
    if (!historial) {
      throw new NotFoundException('La consulta clínica de origen no existe.');
    }
    if (historial.estado !== 'FINALIZADA') {
      throw new ConflictException('Solo se pueden registrar seguimientos en consultas finalizadas.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Crear y guardar el seguimiento
      const nuevoSeguimiento = queryRunner.manager.create(SeguimientoClinico, {
        idHistorialClinicoFk: dto.id_historial_clinico_fk,
        veterinarioId: usuarioId,
        estado: dto.estado || 'FINALIZADO',
        motivo: dto.motivo,
        sintomas: dto.sintomas || null,
        observaciones: dto.observaciones || null,
        tratamiento: dto.tratamiento || null,
        diagnosticoActual: dto.diagnostico_actual || null,
        recomendaciones: dto.recomendaciones || null,
        pesoKg: dto.peso_kg ? Number(dto.peso_kg) : null,
        temperaturaC: dto.temperatura_c ? Number(dto.temperatura_c) : null,
        frecuenciaCardiaca: dto.frecuencia_cardiaca ? Number(dto.frecuencia_cardiaca) : null,
        frecuenciaRespiratoria: dto.frecuencia_respiratoria ? Number(dto.frecuencia_respiratoria) : null,
        mucosas: dto.mucosas || null,
        createdBy: usuarioId,
        updatedBy: usuarioId,
      });

      const seguimientoGuardado = await queryRunner.manager.save(SeguimientoClinico, nuevoSeguimiento);

      // 3. Crear receta si es provista
      if (dto.receta && dto.receta.length > 0) {
        const nuevaReceta = queryRunner.manager.create(Receta, {
          idSeguimientoFk: seguimientoGuardado.id,
          idVeterinarioFk: usuarioId,
          indicacionesGrales: dto.recomendaciones || 'Tomar según indicaciones del seguimiento',
          createdBy: usuarioId,
          updatedBy: usuarioId,
        });
        const recetaGuardada = await queryRunner.manager.save(Receta, nuevaReceta);

        for (const item of dto.receta) {
          const detalle = queryRunner.manager.create(DetallesReceta, {
            idRecetaFk: recetaGuardada.id,
            idProductoFk: item.id_producto || null,
            medicamentoTexto: item.medicamento_texto || null,
            dosis: item.dosis,
            frecuencia: item.frecuencia,
            duracionDias: item.duracion_dias || null,
            createdBy: usuarioId,
          });
          await queryRunner.manager.save(DetallesReceta, detalle);
        }
      }

      await queryRunner.commitTransaction();
      return this.obtenerDetalle(seguimientoGuardado.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async obtenerDetalle(id: string): Promise<any> {
    const seg = await this.seguimientoRepo.findOne({
      where: { id },
      relations: ['recetas', 'recetas.detalles', 'recetas.detalles.producto', 'veterinario'],
    });
    if (!seg) throw new NotFoundException('Seguimiento clínico no encontrado.');
    return this.mapToDto(seg);
  }

  async listarPorConsulta(idHistorial: string): Promise<any[]> {
    const lista = await this.seguimientoRepo.find({
      where: { idHistorialClinicoFk: idHistorial },
      relations: ['recetas', 'recetas.detalles', 'recetas.detalles.producto', 'veterinario'],
      order: { fecha: 'ASC', hora: 'ASC' },
    });
    return lista.map((s) => this.mapToDto(s));
  }

  private mapToDto(s: SeguimientoClinico): any {
    return {
      id: s.id,
      id_historial_clinico_fk: s.idHistorialClinicoFk,
      fecha: s.fecha,
      hora: s.hora,
      estado: s.estado,
      motivo: s.motivo,
      sintomas: s.sintomas,
      observaciones: s.observaciones,
      tratamiento: s.tratamiento,
      diagnostico_actual: s.diagnosticoActual,
      recomendaciones: s.recomendaciones,
      peso_kg: s.pesoKg ? Number(s.pesoKg) : null,
      temperatura_c: s.temperaturaC ? Number(s.temperaturaC) : null,
      frecuencia_cardiaca: s.frecuenciaCardiaca,
      frecuencia_respiratoria: s.frecuenciaRespiratoria,
      mucosas: s.mucosas,
      veterinario: s.veterinario ? {
        id: s.veterinario.id,
        nombres: s.veterinario.nombres,
        apellidos: s.veterinario.apellidos,
        email: s.veterinario.email,
      } : undefined,
      recetas: s.recetas ? s.recetas.map((r) => ({
        id: r.id,
        indicaciones_grales: r.indicacionesGrales,
        detalles: r.detalles ? r.detalles.map((d) => ({
          id: d.id,
          medicamento_texto: d.medicamentoTexto,
          dosis: d.dosis,
          frecuencia: d.frecuencia,
          duracion_dias: d.duracionDias,
          producto: d.producto ? {
            id: d.producto.id,
            nombre: d.producto.nombre,
          } : undefined,
        })) : [],
      })) : [],
    };
  }
}
