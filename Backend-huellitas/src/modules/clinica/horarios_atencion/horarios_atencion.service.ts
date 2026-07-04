import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {UpdateHorariosAtencionDto} from './dto/update-horarios_atencion.dto';
import { HorarioAtencion } from './entities/horarios_atencion.entity';
import { FechaBloqueada } from './entities/fechas_bloqueadas.entity';
import { CreateFechaBloqueadaDto } from './dto/create-fecha_bloqueada.dto';
import { CreateHorarioDto } from './dto/create-horarios_atencion.dto';
import { Cita } from '../citas/entities/cita.entity';
import { HorariosAtencionResponseDto } from './dto/horarios_atencion-response.dto';

@Injectable()
export class HorariosAtencionService {
  constructor(
    @InjectRepository(HorarioAtencion)
    private readonly horariosRepository: Repository<HorarioAtencion>,

    @InjectRepository(Cita) // Inyectamos el repositorio de Citas para validar conflictos
    private readonly citasRepository: Repository<Cita>,

    @InjectRepository(FechaBloqueada)
    private readonly fechasBloqueadasRepository: Repository<FechaBloqueada>,
  ) {}

  private mapToResponse(h: HorarioAtencion): HorariosAtencionResponseDto {
    return {
      id: h.id,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      activo: h.activo,
      veterinario: h.veterinario ? {
        id: h.veterinario.id,
        nombres: h.veterinario.nombres,
        apellidos: h.veterinario.apellidos,
        email: h.veterinario.email,
      } : undefined,
    };
  }

  private async findEntity(id: string): Promise<HorarioAtencion> {
    const horario = await this.horariosRepository.findOne({
      where: { id },
      relations: ['veterinario'],
    });
    if (!horario) throw new NotFoundException('Horario no encontrado');
    return horario;
  }

  async findOne(id: string): Promise<HorariosAtencionResponseDto> {
    const entity = await this.findEntity(id);
    return this.mapToResponse(entity);
  }

// 1. Agregamos el usuarioId como segundo parámetro
  async create(createHorarioDto: CreateHorarioDto, usuarioId: string): Promise<HorariosAtencionResponseDto> {
    const { dia_semana, hora_inicio, hora_fin, id_veterinario_fk } = createHorarioDto;

    if (hora_inicio >= hora_fin) {
      throw new BadRequestException('Incoherencia temporal: La hora de inicio debe ser anterior a la hora de fin.');
    }

    // Regla 2: Evitar solapamientos
    const overlap = await this.horariosRepository.createQueryBuilder('horario')
      .where('horario.id_veterinario_fk = :vetId', { vetId: id_veterinario_fk })
      .andWhere('horario.dia_semana = :diaSemana', { diaSemana: dia_semana })
      .andWhere('horario.activo = true')
      .andWhere('(horario.hora_inicio < :fin AND horario.hora_fin > :inicio)', { 
        inicio: hora_inicio, 
        fin: hora_fin 
      })
      .getOne();

    if (overlap) {
      throw new ConflictException('El veterinario ya tiene un bloque de turno activo que choca con este nuevo horario en el mismo día.');
    }

    // 3. LA SOLUCIÓN AL ERROR DE POSTGRES:
    // Creamos el objeto combinando los datos del DTO y llenando los campos de auditoría
    const nuevoHorario = this.horariosRepository.create({
      ...createHorarioDto,
      createdBy: usuarioId, // Le decimos a PostgreSQL quién lo creó
      updatedBy: usuarioId  // Y quién fue el último en actualizarlo (al crearlo, es el mismo)
    });

    const guardado = await this.horariosRepository.save(nuevoHorario);
    return this.findOne(guardado.id);
  }

  // Método extra muy útil para que el Frontend dibuje la agenda
  async findAllByVeterinario(idVeterinario: string): Promise<HorariosAtencionResponseDto[]> {
    const horarios = await this.horariosRepository.find({
      where: { 
        id_veterinario_fk: idVeterinario,
        activo: true 
      },
      relations: ['veterinario'],
      order: {
        dia_semana: 'ASC',
        hora_inicio: 'ASC',
      }
    });
    return horarios.map(h => this.mapToResponse(h));
  }


  async update(id: string, updateHorarioDto: UpdateHorariosAtencionDto): Promise<HorariosAtencionResponseDto> {
    const horario = await this.findEntity(id);

    // REGLA DE NEGOCIO: ¿Podemos cambiar este horario?
    // Buscamos si hay citas Pendientes o En Curso que choquen con el horario "viejo" 
    // y que estén en el futuro. (Lógica simplificada para el ejemplo)
    const citasPendientes = await this.citasRepository.createQueryBuilder('cita')
      .where('cita.id_veterinario_fk = :vetId', { vetId: horario.id_veterinario_fk })
      .andWhere('cita.estado IN (:...estados)', { estados: ['Pendiente', 'En_Curso'] })
      // Aquí iría la lógica para comparar si el día de la semana coincide con las citas futuras
      .getCount();

    if (citasPendientes > 0) {
      throw new BadRequestException('No puedes modificar este horario porque el veterinario tiene citas pendientes. Reasigna las citas primero.');
    }

    // Si no hay peligro, actualizamos
    Object.assign(horario, updateHorarioDto);
    const guardado = await this.horariosRepository.save(horario);
    return this.findOne(guardado.id);
  }

  async desactivar(id: string): Promise<void> {
    const horario = await this.findEntity(id);

    // Mismo chequeo de seguridad que el Update
    const citasPendientes = await this.citasRepository.count({
      where: { 
        id_veterinario_fk: horario.id_veterinario_fk,
        // Faltaría filtrar por citas que caigan exactamente en este día de la semana
      }
    });

    if (citasPendientes > 0) {
      throw new BadRequestException('No puedes desactivar este turno porque hay pacientes agendados.');
    }

    // Cumpliendo tu requerimiento de inmutabilidad (Soft Delete / Inactivación)
    horario.activo = false;
    await this.horariosRepository.save(horario);
    
    // Alternativa si configuras SoftDelete en TypeORM:
    // await this.horariosRepository.softDelete(id); 
  }

  // --- GESTIÓN DE FECHAS BLOQUEADAS ---

  async crearBloqueo(dto: CreateFechaBloqueadaDto, usuarioId: string): Promise<FechaBloqueada> {
    const { fecha, motivo, id_veterinario_fk } = dto;

    // Verificar si ya existe un bloqueo activo idéntico para esa fecha
    const existe = await this.fechasBloqueadasRepository.findOne({
      where: {
        fecha,
        id_veterinario_fk: id_veterinario_fk ? id_veterinario_fk : IsNull(),
      },
    });

    if (existe) {
      throw new ConflictException(`Ya existe un bloqueo registrado para la fecha ${fecha} con ese alcance.`);
    }

    const nuevoBloqueo = this.fechasBloqueadasRepository.create({
      fecha,
      motivo,
      id_veterinario_fk: id_veterinario_fk || null,
      createdBy: usuarioId,
    });

    return await this.fechasBloqueadasRepository.save(nuevoBloqueo);
  }

  async listarBloqueos(): Promise<FechaBloqueada[]> {
    return await this.fechasBloqueadasRepository.find({
      relations: ['veterinario'],
      order: { fecha: 'DESC' },
    });
  }

  async eliminarBloqueo(id: string): Promise<void> {
    const bloqueo = await this.fechasBloqueadasRepository.findOne({ where: { id } });
    if (!bloqueo) {
      throw new NotFoundException('Bloqueo de fecha no encontrado.');
    }
    await this.fechasBloqueadasRepository.softRemove(bloqueo);
  }
}