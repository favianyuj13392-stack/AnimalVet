/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpedienteClinico } from './entities/expediente_clinico.entity';
import { CreateExpedienteClinicoDto } from './dto/create-expediente_clinico.dto';
import { ExpedienteClinicoResponseDto } from './dto/expediente_clinico-response.dto';

@Injectable()
export class ExpedienteClinicoService {
  constructor(
    @InjectRepository(ExpedienteClinico)
    private readonly expedienteRepository: Repository<ExpedienteClinico>,
  ) {}

private mapToResponse(expediente: ExpedienteClinico): ExpedienteClinicoResponseDto {
    return {
      id: expediente.id,
      fecha_apertura: expediente.fecha_apertura,
      notas_generales: expediente.notas_generales ?? undefined,
      mascota: expediente.mascota ? {
        id: expediente.mascota.id,
        nombre: expediente.mascota.nombre,
        sexo: expediente.mascota.sexo,
      } : undefined,
      historiales: expediente.historiales ? expediente.historiales.map(h => {
        const hDto: any = {
          id: h.id,
          fecha_consulta: h.fecha_consulta,
          motivo_consulta: h.motivo_consulta,
          sintomas: h.sintomas ?? undefined,
          diagnostico: h.diagnostico,
          notas_internas: h.notas_internas ?? undefined,
          peso_actual_kg: Number(h.peso_kg),
          temperatura_c: Number(h.temperatura_c),
          frecuencia_cardiaca: Number(h.frecuencia_cardiaca),
          frecuencia_respiratoria: Number(h.frecuencia_respiratoria),
          tipo_atencion: h.tipo_atencion,
          triaje_completado: h.triaje_completado,
          estado: h.estado,
          veterinario: h.veterinario ? {
            id: h.veterinario.id,
            nombres: h.veterinario.nombres,
            apellidos: h.veterinario.apellidos,
            email: h.veterinario.email,
          } : undefined,
          cita: h.cita ? {
            id: h.cita.id,
            servicio: h.cita.servicio ? {
              id: h.cita.servicio.id,
              nombre: h.cita.servicio.nombre,
              precio: Number(h.cita.servicio.precio)
            } : undefined
          } : undefined,
          
          hospitalizacion: h.hospitalizacion ? {
            id: h.hospitalizacion.id,
            fecha_ingreso: h.hospitalizacion.fechaIngreso,
            fecha_alta: h.hospitalizacion.fechaAlta ?? undefined,
            motivo_ingreso: h.hospitalizacion.motivoIngreso,
            estado_actual: h.hospitalizacion.estadoActual,
            costo_por_dia: h.hospitalizacion.costoPorDia ? Number(h.hospitalizacion.costoPorDia) : 0,
            
            // 👇 CORRECCIÓN INSUMOS: Se envían los objetos completos con precio
            insumos: h.hospitalizacion.insumos ? h.hospitalizacion.insumos.map((i: any) => ({
              id: i.id,
              cantidad: i.cantidad,
              fecha_registro: i.fechaRegistro,
              notas: i.notas,
              tipo: i.id_producto_fk ? 'PRODUCTO' : 'SERVICIO',
              nombre_item: i.id_producto_fk ? i.producto?.nombre : i.servicio?.nombre,
              producto: i.producto ? {
                id: i.producto.id,
                nombre: i.producto.nombre,
                precioVenta: Number(i.producto.precioVenta), // <- PRECIO AGREGADO
              } : undefined,
              servicio: i.servicio ? {
                id: i.servicio.id,
                nombre: i.servicio.nombre,
                precio: Number(i.servicio.precio), // <- PRECIO AGREGADO
              } : undefined,
            })) : [],
            
            // 👇 CORRECCIÓN VACUNAS: Se envía el producto anidado
            vacunas_aplicadas: h.hospitalizacion.vacunasAplicadas ? h.hospitalizacion.vacunasAplicadas.map((v: any) => ({
              id: v.id,
              fecha_aplicacion: v.fechaAplicacion,
              nombre_vacuna: v.vacuna?.nombre,
              lote_vacuna: v.loteVacuna,
              fecha_proxima_dosis: v.fechaProximaDosis,
              vacuna: v.vacuna ? {
                id: v.vacuna.id,
                nombre: v.vacuna.nombre,
                producto: v.vacuna.producto ? {
                  id: v.vacuna.producto.id,
                  nombre: v.vacuna.producto.nombre,
                  precioVenta: Number(v.vacuna.producto.precioVenta), // <- PRECIO AGREGADO
                } : undefined,
              } : undefined,
            })) : [],

            archivos: h.hospitalizacion.archivos ? h.hospitalizacion.archivos.map((a: any) => ({
              id: a.id,
              url_archivo: a.urlArchivo,
              nombre_archivo: a.nombreArchivo,
              tipo_estudio: a.tipoEstudio,
              fecha_estudio: a.fechaEstudio,
            })) : []
          } : undefined,
        };

        

        if (h.recetas) {
          hDto.recetas = h.recetas.map(r => ({
            id: r.id,
            indicaciones_grales: r.indicacionesGrales,
            detalles: r.detalles ? r.detalles.map(d => ({
              id: d.id,
              medicamento_texto: d.medicamentoTexto ?? undefined,
              dosis: d.dosis,
              frecuencia: d.frecuencia,
              duracion_dias: d.duracionDias ?? undefined,
              // 👇 CORRECCIÓN PRODUCTOS EN RECETA
              producto: d.producto ? {
                id: d.producto.id,
                nombre: d.producto.nombre,
                precioVenta: Number(d.producto.precioVenta), // <- PRECIO AGREGADO
              } : undefined,
            })) : [],
          }));
        }

        if (h.vacunasAplicadas) {
          hDto.vacunas_aplicadas = h.vacunasAplicadas.map(v => ({
            id: v.id,
            fecha_aplicacion: v.fechaAplicacion,
            fecha_proxima_dosis: v.fechaProximaDosis ?? undefined,
            peso_mascota_kg: v.pesoMascotaKg ? Number(v.pesoMascotaKg) : undefined,
            lote_vacuna: v.loteVacuna ?? undefined,
            // 👇 CORRECCIÓN VACUNAS EN HISTORIAL
            vacuna: v.vacuna ? {
              id: v.vacuna.id,
              nombre: v.vacuna.nombre,
              producto: v.vacuna.producto ? {
                id: v.vacuna.producto.id,
                nombre: v.vacuna.producto.nombre,
                precioVenta: Number(v.vacuna.producto.precioVenta), // <- PRECIO AGREGADO
              } : undefined,
            } : undefined,
          }));
        }

        if (h.archivosAdjuntos) {
          hDto.archivos_adjuntos = h.archivosAdjuntos.map(a => ({
              id: a.id,
              url_archivo: a.urlArchivo,
              nombre_archivo: a.nombreArchivo,
              tipo_estudio: a.tipoEstudio,
              fecha_estudio: a.fechaEstudio,
          }));
        }

        return hDto;
      }) : [],
    };
  }

  async create(dto: CreateExpedienteClinicoDto, usuarioId: string): Promise<ExpedienteClinicoResponseDto> {
    const existe = await this.expedienteRepository.findOne({ 
      where: { id_mascota_fk: dto.id_mascota_fk } 
    });

    if (existe) {
      throw new ConflictException('Esta mascota ya cuenta con un expediente clínico activo.');
    }

    const nuevo = this.expedienteRepository.create({
      ...dto,
      createdBy: usuarioId,
      updatedBy: usuarioId
    });

    const guardado = await this.expedienteRepository.save(nuevo);
    return this.findByMascota(guardado.id_mascota_fk);
  }

private getRelations() {
    return [
      'mascota', 
      'historiales', 
      'historiales.veterinario', 
      'historiales.recetas',
      'historiales.recetas.detalles',
      'historiales.recetas.detalles.producto', // Ya trae el producto para la receta
      'historiales.vacunasAplicadas',
      'historiales.vacunasAplicadas.vacuna',
      'historiales.vacunasAplicadas.vacuna.producto', // <- NUEVO: Traer producto de la vacuna
      'historiales.archivosAdjuntos',
      'historiales.cita',
      'historiales.cita.servicio',
      'historiales.hospitalizacion', 
      'historiales.hospitalizacion.insumos',
      'historiales.hospitalizacion.insumos.producto', 
      'historiales.hospitalizacion.insumos.servicio', 
      'historiales.hospitalizacion.archivos',
      'historiales.hospitalizacion.vacunasAplicadas',
      'historiales.hospitalizacion.vacunasAplicadas.vacuna',
      'historiales.hospitalizacion.vacunasAplicadas.vacuna.producto' // <- NUEVO: Traer producto de vacuna hosp.
    ];
  }
  async findByMascota(idMascota: string): Promise<ExpedienteClinicoResponseDto> {
    const expediente = await this.expedienteRepository.findOne({
      where: { id_mascota_fk: idMascota },
      relations: this.getRelations(),
      order: {
        historiales: {
          fecha_consulta: 'DESC', 
        },
      },
    });

    if (!expediente) {
      throw new NotFoundException('No se encontró un expediente clínico para esta mascota.');
    }
    return this.mapToResponse(expediente);
  }

  async findAll(): Promise<ExpedienteClinicoResponseDto[]> {
    const expedientes = await this.expedienteRepository.find({
      relations: this.getRelations(),
      order: {
        historiales: {
          fecha_consulta: 'DESC',
        },
      },
    });
    return expedientes.map(e => this.mapToResponse(e));
  }
}