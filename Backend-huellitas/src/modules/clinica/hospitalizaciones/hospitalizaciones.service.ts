import { Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hospitalizacion } from './entities/hospitalizacione.entity';
import { CreateHospitalizacioneDto } from './dto/create-hospitalizacione.dto';
import { UpdateHospitalizacioneDto } from './dto/update-hospitalizacione.dto';
import { HospitalizacionesResponseDto } from './dto/hospitalizaciones-response.dto';

@Injectable()
export class HospitalizacionesService {
  constructor(
    @InjectRepository(Hospitalizacion)
    private readonly hospitalizacionRepo: Repository<Hospitalizacion>,
  ) {}

  private mapToResponse(h: Hospitalizacion): any {
    return {
      id: h.id,
      id_historial_fk: h.id_historial_fk,
      fecha_ingreso: h.fechaIngreso,
      fecha_alta: h.fechaAlta ?? undefined,
      motivo_ingreso: h.motivoIngreso,
      estado_actual: h.estadoActual,
      costo_por_dia:       h.costoPorDia ? Number(h.costoPorDia) : 0,
      condicion_egreso:    h.condicionEgreso   ?? null,
      diagnostico_egreso:  h.diagnosticoEgreso ?? null,
      instrucciones_alta:  h.instruccionesAlta ?? null,
    mascota: h.mascota ? {
        id: h.mascota.id,
        nombre: h.mascota.nombre,
        foto_url: h.mascota.foto_url ?? null,
        sexo: h.mascota.sexo,
        id_dueno_fk: h.mascota.id_dueno_fk ?? null,
        raza: h.mascota.raza ? {
          id: h.mascota.raza.id,
          nombre: h.mascota.raza.nombre,
        } : null,
      } : undefined,
      veterinario: h.veterinario ? {
        id: h.veterinario.id,
        nombres: h.veterinario.nombres,
        apellidos: h.veterinario.apellidos,
        email: h.veterinario.email,
      } : undefined,
      
      // 👇 NUEVOS MAPEOS CLÍNICOS PARA EL DASHBOARD DE REACT
      insumos: h.insumos ? h.insumos.map(i => ({
        id: i.id,
        cantidad: i.cantidad,
        fecha_registro: i.fechaRegistro,
        notas: i.notas,
        tipo: i.id_producto_fk ? 'PRODUCTO' : 'SERVICIO',
        nombre_item: i.id_producto_fk ? i.producto?.nombre : i.servicio?.nombre
      })) : [],
      
      vacunas_aplicadas: h.vacunasAplicadas ? h.vacunasAplicadas.map(v => ({
        id: v.id,
        fecha_aplicacion: v.fechaAplicacion,
        nombre_vacuna: v.vacuna?.nombre,
        lote_vacuna: v.loteVacuna,
        fecha_proxima_dosis: v.fechaProximaDosis
      })) : [],

      archivos: h.archivos ? h.archivos.map(a => ({
        id: a.id,
        url_archivo: a.urlArchivo,
        nombre_archivo: a.nombreArchivo,
        tipo_estudio: a.tipoEstudio,
        fecha_estudio: a.fechaEstudio,
      })) : []
    };
  }

  private async findEntity(id: string): Promise<Hospitalizacion> {
    const hospitalizacion = await this.hospitalizacionRepo.findOne({
      where: { id },
      // 👇 CARGA DE RELACIONES PROFUNDAS (Insumos y Vacunas)
      relations: [
        'mascota', 
        'mascota.raza', // 👈 ¡AÑADE ESTA LÍNEA!
        'veterinario', 
        'historial', 
        'insumos', 
        'insumos.producto', 
        'insumos.servicio', 
        'vacunasAplicadas', 
        'vacunasAplicadas.vacuna',
        'archivos' // 👈 AÑADIR ESTO AL ARREGLO DE RELACIONES
      ],
    });

    if (!hospitalizacion) {
      throw new NotFoundException(`Hospitalización con ID ${id} no encontrada.`);
    }

    return hospitalizacion;
  }

  async create(createDto: CreateHospitalizacioneDto, creatorId: string): Promise<HospitalizacionesResponseDto> {
    const nuevaHospitalizacion = this.hospitalizacionRepo.create({
      id_historial_fk: createDto.id_historial_fk,
      id_mascota_fk: createDto.id_mascota_fk,
      id_veterinario_responsable: createDto.id_veterinario_responsable,
      fechaIngreso: new Date(createDto.fecha_ingreso),
      fechaAlta: createDto.fecha_alta ? new Date(createDto.fecha_alta) : null,
      motivoIngreso: createDto.motivo_ingreso,
      estadoActual: createDto.estado_actual ?? 'Observacion',
      costoPorDia: createDto.costo_por_dia ?? 150.00,
      createdBy: creatorId,
      createdByUser: { id: creatorId } as any,
    });

    const guardada = await this.hospitalizacionRepo.save(nuevaHospitalizacion);
    return this.findOne(guardada.id);
  }

  async findAll(estado?: string): Promise<any[]> {
    const where: any = {};
    if (estado) where.estadoActual = estado;
    const hospitalizaciones = await this.hospitalizacionRepo.find({
      where,
      relations: ['mascota', 'mascota.raza', 'veterinario', 'insumos', 'insumos.producto', 'insumos.servicio', 'vacunasAplicadas', 'vacunasAplicadas.vacuna'],
      order: { fechaIngreso: 'DESC' },
    });
    return hospitalizaciones.map(h => this.mapToResponse(h));
  }

  async findByMascota(idMascota: string): Promise<any[]> {
    const hosps = await this.hospitalizacionRepo.find({
      where: { id_mascota_fk: idMascota } as any,
      relations: ['mascota', 'mascota.raza', 'veterinario', 'insumos', 'insumos.producto', 'vacunasAplicadas', 'vacunasAplicadas.vacuna', 'archivos'],
      order: { fechaIngreso: 'DESC' } as any,
    });
    return hosps.map(h => this.mapToResponse(h));
  }

  async findOne(id: string): Promise<any> {
    const entity = await this.findEntity(id);
    return this.mapToResponse(entity);
  }

  async update(id: string, updateDto: UpdateHospitalizacioneDto, updaterId: string): Promise<HospitalizacionesResponseDto> {
    const hospitalizacion = await this.findEntity(id);

    if (updateDto.fecha_alta !== undefined) {
      hospitalizacion.fechaAlta = updateDto.fecha_alta ? new Date(updateDto.fecha_alta) : null;
    }
    if (updateDto.estado_actual !== undefined) {
      hospitalizacion.estadoActual = updateDto.estado_actual;
      if (updateDto.estado_actual === 'Alta' && !hospitalizacion.fechaAlta && !updateDto.fecha_alta) {
        hospitalizacion.fechaAlta = new Date();
      }
    }
    if (updateDto.condicion_egreso !== undefined)    hospitalizacion.condicionEgreso   = updateDto.condicion_egreso;
    if (updateDto.diagnostico_egreso !== undefined)  hospitalizacion.diagnosticoEgreso  = updateDto.diagnostico_egreso;
    if (updateDto.instrucciones_alta !== undefined)  hospitalizacion.instruccionesAlta  = updateDto.instrucciones_alta;
    if (updateDto.costo_por_dia !== undefined)        hospitalizacion.costoPorDia        = updateDto.costo_por_dia;
    hospitalizacion.updatedBy = updaterId;

    const guardada = await this.hospitalizacionRepo.save(hospitalizacion);
    return this.findOne(guardada.id);
  }

  async remove(id: string): Promise<{ mensaje: string }> {
    const hospitalizacion = await this.findEntity(id);
    await this.hospitalizacionRepo.softRemove(hospitalizacion);
    return { mensaje: `Hospitalización con ID ${id} desactivada correctamente.` };
  }
}