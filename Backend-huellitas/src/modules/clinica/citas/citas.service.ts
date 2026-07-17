import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';

import { Cita } from './entities/cita.entity';
import { HorarioAtencion } from '../horarios_atencion/entities/horarios_atencion.entity';
import { FechaBloqueada } from '../horarios_atencion/entities/fechas_bloqueadas.entity';
import { Servicio } from '../../core/servicios/entities/servicio.entity'; 
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity'; 

import { CreateCitaDto } from './dto/create-cita.dto';
import { CitasGateway } from './citas.gateway';
import { CitaResponseDto } from './dto/cita-response.dto';
import { LogsSistemaService } from '../../core/logs_sistema/logs_sistema.service';

@Injectable()
export class CitasService {
  private getBoliviaDateParts(date: Date) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10) - 1; // 0-indexed
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    const second = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);

    const adjustedHour = hour === 24 ? 0 : hour;

    return { year, month, day, hour: adjustedHour, minute, second };
  }

  constructor(
    @InjectRepository(Cita) private readonly citasRepository: Repository<Cita>,
    @InjectRepository(HorarioAtencion) private readonly horariosRepository: Repository<HorarioAtencion>,
    @InjectRepository(Servicio) private readonly serviciosRepository: Repository<Servicio>,
    @InjectRepository(FechaBloqueada) private readonly fechasBloqueadasRepository: Repository<FechaBloqueada>,
    @InjectRepository(HistorialClinico) private readonly historialRepository: Repository<HistorialClinico>,
    private readonly citasGateway: CitasGateway,
    private readonly logsService: LogsSistemaService,
  ) {}

  private readonly logger = new Logger(CitasService.name);

  private mapToResponse(cita: Cita): CitaResponseDto {
    return {
      id: cita.id,
      fecha_hora_inicio: cita.fecha_hora_inicio,
      duracion_minutos: cita.duracion_minutos,
      motivo_cita: cita.motivo_cita,
      tipo_prioridad: cita.tipo_prioridad,
      estado: cita.estado,
      origen_reserva: cita.origen_reserva,
      requiere_confirmacion: cita.requiere_confirmacion,
      motivo_cancelacion: cita.motivo_cancelacion ?? null,
      deletedAt: cita.deletedAt ?? undefined,
      createdAt: cita.createdAt,
      updatedAt: cita.updatedAt,
      mascota: cita.mascota ? {
        id: cita.mascota.id,
        nombre: cita.mascota.nombre,
        foto_url: cita.mascota.foto_url ?? null,
        sexo: cita.mascota.sexo,
        fecha_nacimiento: cita.mascota.fecha_nacimiento ?? null,
        raza: cita.mascota.raza ? {
          id: cita.mascota.raza.id,
          nombre: cita.mascota.raza.nombre,
          especie: cita.mascota.raza.especie ? {
            id: cita.mascota.raza.especie.id,
            nombre: cita.mascota.raza.especie.nombre,
          } : null,
        } : null,
        dueno: cita.mascota.dueno ? {
          id: cita.mascota.dueno.id,
          nombres: cita.mascota.dueno.nombres,
          apellidos: cita.mascota.dueno.apellidos,
          email: cita.mascota.dueno.email,
          telefono: cita.mascota.dueno.telefono ?? null,
        } : null,
      } : undefined,
      veterinario: cita.veterinario ? {
        id: cita.veterinario.id,
        nombres: cita.veterinario.nombres,
        apellidos: cita.veterinario.apellidos,
        email: cita.veterinario.email,
      } : undefined,
      servicio: cita.servicio ? {
        id: cita.servicio.id,
        nombre: cita.servicio.nombre,
        duracion_minutos: cita.servicio.duracion_minutos,
        precio: Number(cita.servicio.precio),
      } : undefined,
    };
  }

async create(createCitaDto: CreateCitaDto, usuarioId: string): Promise<CitaResponseDto> {
    const { fecha_hora_inicio, id_veterinario_fk, id_servicio_fk } = createCitaDto;
    
    const servicio = await this.serviciosRepository.findOne({ where: { id: id_servicio_fk } });
    if (!servicio) {
      throw new BadRequestException('El servicio solicitado no existe en el catálogo.');
    }

    const duracionFinal = servicio.duracion_minutos || 30; // Aseguramos una duración por defecto
    
    // --- 1. PARSEO LITERAL DE HORA EN BOLIVIA ---
    // --- 1. PARSEO LITERAL DE HORA EN BOLIVIA ---
    let fechaString = '';
    
    // Si NestJS lo convirtió en un objeto Date, extraemos los números exactos
    if (fecha_hora_inicio instanceof Date) {
      const yyyy = fecha_hora_inicio.getFullYear();
      const mm = String(fecha_hora_inicio.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha_hora_inicio.getDate()).padStart(2, '0');
      const hh = String(fecha_hora_inicio.getHours()).padStart(2, '0');
      const min = String(fecha_hora_inicio.getMinutes()).padStart(2, '0');
      const ss = String(fecha_hora_inicio.getSeconds()).padStart(2, '0');
      
      fechaString = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    } else {
      // Si llegó como string puro, lo usamos tal cual
      fechaString = String(fecha_hora_inicio);
    }

    let fechaParte = '';
    let horaParte = '';
    const match = fechaString.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/);
    if (match) {
      fechaParte = match[1];
      horaParte = match[2];
    } else {
      const matchFecha = fechaString.match(/^(\d{4}-\d{2}-\d{2})/);
      if (matchFecha) {
        fechaParte = matchFecha[1];
        horaParte = '00:00:00';
      } else {
        throw new BadRequestException('El formato de fecha y hora no es válido. Use YYYY-MM-DDTHH:mm:ss');
      }
    }

    // --- 2. VALIDACIÓN DE BLOQUEO DE FECHAS ---
    const bloqueo = await this.fechasBloqueadasRepository.findOne({
      where: [
        { fecha: fechaParte, id_veterinario_fk: IsNull() }, 
        { fecha: fechaParte, id_veterinario_fk: id_veterinario_fk }, 
      ],
    });

    if (bloqueo) {
      const alcance = bloqueo.id_veterinario_fk ? 'para el veterinario seleccionado' : 'para toda la clínica';
      throw new BadRequestException(`No se puede programar la cita: La fecha ${fechaParte} está bloqueada ${alcance} debido a [${bloqueo.motivo}].`);
    }

    const fechaInicio = new Date(`${fechaParte}T${horaParte}.000-04:00`);
    const fechaFin = new Date(fechaInicio.getTime() + duracionFinal * 60000); 

    // --- 3. VALIDACIÓN DE HORARIO LABORAL ---
    const partsInicio = this.getBoliviaDateParts(fechaInicio);
    const partsFin = this.getBoliviaDateParts(fechaFin);

    const dateInicioLocal = new Date(partsInicio.year, partsInicio.month, partsInicio.day, partsInicio.hour, partsInicio.minute, partsInicio.second);
    let diaSemana = dateInicioLocal.getDay();
    if (diaSemana === 0) diaSemana = 7; 
    
    const horaStr = `${partsInicio.hour.toString().padStart(2, '0')}:${partsInicio.minute.toString().padStart(2, '0')}:00`;
    const horaFinStr = `${partsFin.hour.toString().padStart(2, '0')}:${partsFin.minute.toString().padStart(2, '0')}:00`;

    // Consulta segura con leftJoin
    const horarioValido = await this.horariosRepository.createQueryBuilder('horario')
      .leftJoin('horario.veterinario', 'veterinario') 
      .where('veterinario.id = :vetId', { vetId: id_veterinario_fk })
      .andWhere('horario.dia_semana = :diaSemana', { diaSemana })
      .andWhere('horario.activo = true')
      .andWhere('horario.hora_inicio <= :hora', { hora: horaStr })
      .andWhere('horario.hora_fin >= :horaFinStr', { horaFinStr })
      .getOne();

    if (!horarioValido) {
      throw new BadRequestException(`El veterinario no atiende el día ${diaSemana} de ${horaStr} a ${horaFinStr}.`);
    }

    // --- 4. DETECCIÓN DE COLISIONES (OVERLAPS) ---
    const colision = await this.citasRepository.createQueryBuilder('cita')
      .where('cita.id_veterinario_fk = :vetId', { vetId: id_veterinario_fk })
      .andWhere('cita.estado NOT IN (:...estados)', { estados: ['Cancelada', 'No_Asistio', 'Completada'] })
      .andWhere(`(
        cita.fecha_hora_inicio < :fechaFin 
        AND 
        (cita.fecha_hora_inicio + (cita.duracion_minutos || ' minutes')::interval) > :fechaInicio
      )`, { fechaInicio, fechaFin })
      .getOne();

    if (colision) {
      throw new ConflictException('El horario seleccionado choca con otra cita existente para este veterinario.');
    }

    // --- 5. PERSISTENCIA ---
    const nuevaCita = this.citasRepository.create({
      ...createCitaDto,
      fecha_hora_inicio: fechaInicio,
      duracion_minutos: duracionFinal,
      estado: 'Pendiente',
      requiere_confirmacion: false,
      createdBy: usuarioId,
      updatedBy: usuarioId,
    });

    const citaGuardada = await this.citasRepository.save(nuevaCita);
    const citaCompleta = await this.findOne(citaGuardada.id);
    this.citasGateway.emitirCitaCreada(citaCompleta as any);

    await this.logsService.registrar({
      usuarioId,
      accion: 'CITA_CREADA',
      categoria: 'CLINICO',
      tablaAfectada: 'citas',
      registroId: citaGuardada.id,
      detalles: { fecha: citaGuardada.fecha_hora_inicio, estado: citaGuardada.estado },
    });

    return citaCompleta;
  }


  // ... (tu método create anterior)

  async cambiarEstado(id: string, nuevoEstado: string, usuarioId: string, userRole: string, motivoCancelacion?: string): Promise<CitaResponseDto> {
    const cita = await this.citasRepository.findOne({ where: { id } });
    
    if (!cita) {
      throw new NotFoundException('La cita solicitada no existe.');
    }

    // El veterinario interactúa con la cita únicamente cambiándola a "En_Curso"
    if (userRole === 'Veterinario' && nuevoEstado !== 'En_Curso') {
      throw new BadRequestException('El veterinario solo puede cambiar el estado de la cita a [En_Curso]. Las cancelaciones y ausencias corresponden a recepción.');
    }

    const estadoActual = cita.estado;

    // REGLA 1: Estados Finales (Inmutables)
    if (['Completada', 'Cancelada', 'No_Asistio'].includes(estadoActual)) {
      throw new BadRequestException(
        `Transacción bloqueada: No se puede cambiar el estado de una cita que ya está en [${estadoActual}].`
      );
    }

    // REGLA 2: Transiciones desde "Pendiente"
    if (estadoActual === 'Pendiente') {
      if (!['Confirmada', 'En_Curso', 'Cancelada', 'No_Asistio'].includes(nuevoEstado)) {
        throw new BadRequestException(
          `Transición inválida: Una cita [Pendiente] solo puede pasar a [En_Curso], [Cancelada] o [No_Asistio].`
        );
      }
    } 
    
    // REGLA 3: Transiciones desde "En_Curso"
    else if (estadoActual === 'En_Curso') {
      if (nuevoEstado !== 'Completada' && nuevoEstado !== 'Cancelada') {
        throw new BadRequestException(
          `Transición inválida: Una vez que el paciente está [En_Curso], los únicos estados finales posibles son [Completada] o [Cancelada].`
        );
      }
    }

    // Validación obligatoria del motivo si pasa a "Cancelada"
    if (estadoActual === 'Pendiente_Confirmacion') {
      if (!['Confirmada', 'Cancelada'].includes(nuevoEstado)) {
        throw new BadRequestException(
          `Transicion invalida: Una cita [Pendiente_Confirmacion] solo puede pasar a [Confirmada] o [Cancelada].`
        );
      }
    }
    if (estadoActual === 'Confirmada') {
      if (!['En_Curso', 'Cancelada', 'No_Asistio'].includes(nuevoEstado)) {
        throw new BadRequestException(
          `Transicion invalida: Una cita [Confirmada] solo puede pasar a [En_Curso], [Cancelada] o [No_Asistio].`
        );
      }
    }

    if (nuevoEstado === 'Cancelada') {
      if (!motivoCancelacion || motivoCancelacion.trim() === '') {
        throw new BadRequestException('El motivo de cancelación es obligatorio para cancelar una cita.');
      }
      cita.motivo_cancelacion = motivoCancelacion.trim();
    }

    // Si pasa todas las reglas, aplicamos el cambio
    cita.estado = nuevoEstado;
    if (nuevoEstado === 'Confirmada') {
      cita.requiere_confirmacion = false;
    }
    cita.updatedBy = usuarioId;
    
    const citaActualizada = await this.citasRepository.save(cita);

    // AUTOMATIZACIÓN: Si la cita se completa, cerramos el historial clínico asociado
    if (nuevoEstado === 'Completada') {
      const historial = await this.historialRepository.findOne({ where: { id_cita_fk: id } });
      if (historial && historial.estado === 'Abierto') {
        historial.estado = 'Cerrado';
        historial.updatedBy = usuarioId;
        await this.historialRepository.save(historial);
        this.logger.log(`Historial clínico ${historial.id} cerrado automáticamente al completar cita ${id}.`);
      }
    }

    const citaCompleta = await this.findOne(citaActualizada.id);
    this.citasGateway.emitirCitaActualizada(citaCompleta as any);

    await this.logsService.registrar({
      usuarioId,
      accion: 'CITA_ESTADO_CAMBIADO',
      categoria: 'CLINICO',
      tablaAfectada: 'citas',
      registroId: id,
      detalles: { estadoAnterior: estadoActual, estadoNuevo: nuevoEstado },
    });

    return citaCompleta;
  }

  async findAll(query: { mascotaId?: string; veterinarioId?: string; estado?: string; fecha?: string; clienteId?: string }): Promise<CitaResponseDto[]> {
    this.logger.debug(`findAll citas — filtros: ${JSON.stringify(query)}`);
    const whereClause: any = {};

    // Limpieza de parámetros para evitar strings vacíos, "undefined" o "null"
    const cleanParam = (val?: string) => {
      if (!val) return undefined;
      const trimmed = val.trim();
      if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return undefined;
      return trimmed;
    };

    const mascotaId = cleanParam(query.mascotaId);
    const veterinarioId = cleanParam(query.veterinarioId);
    const estado = cleanParam(query.estado);
    const fecha = cleanParam(query.fecha);
    const clienteId = cleanParam(query.clienteId);

    if (mascotaId) {
      whereClause.id_mascota_fk = mascotaId;
    }
    if (veterinarioId) {
      whereClause.id_veterinario_fk = veterinarioId;
    }
    if (estado) {
      whereClause.estado = estado;
    }
    if (fecha) {
      const fechaStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const inicioDia = new Date(`${fechaStr}T00:00:00.000-04:00`);
      const finDia = new Date(`${fechaStr}T23:59:59.999-04:00`);
      whereClause.fecha_hora_inicio = Between(inicioDia, finDia);
    }

    // Si hay clienteId usamos QueryBuilder para filtrar por el dueño de la mascota
    if (clienteId) {
      const qb = this.citasRepository.createQueryBuilder('cita')
        .leftJoinAndSelect('cita.mascota', 'mascota')
        .leftJoinAndSelect('mascota.dueno', 'dueno')
        .leftJoinAndSelect('mascota.raza', 'raza')
        .leftJoinAndSelect('raza.especie', 'especie')
        .leftJoinAndSelect('cita.veterinario', 'veterinario')
        .leftJoinAndSelect('cita.servicio', 'servicio')
        .where('mascota.id_dueno_fk = :clienteId', { clienteId })
        .orderBy('cita.fecha_hora_inicio', 'DESC')
        .withDeleted();

      if (mascotaId) qb.andWhere('cita.id_mascota_fk = :mascotaId', { mascotaId });
      if (estado) qb.andWhere('cita.estado = :estado', { estado });
      if (fecha) {
        const fechaStr = fecha.includes('T') ? fecha.split('T')[0] : fecha;
        const inicioDia = new Date(`${fechaStr}T00:00:00.000-04:00`);
        const finDia = new Date(`${fechaStr}T23:59:59.999-04:00`);
        qb.andWhere('cita.fecha_hora_inicio BETWEEN :ini AND :fin', { ini: inicioDia, fin: finDia });
      }

      const citas = await qb.getMany();
      return citas.map(cita => this.mapToResponse(cita));
    }

    const citas = await this.citasRepository.find({
      where: whereClause,
      relations: ['mascota', 'mascota.dueno', 'mascota.raza', 'mascota.raza.especie', 'veterinario', 'servicio'],
      order: { fecha_hora_inicio: 'DESC' },
      withDeleted: true,
    });

    return citas.map(cita => this.mapToResponse(cita));
  }

  async findOne(id: string): Promise<CitaResponseDto> {
    const cita = await this.citasRepository.findOne({
      where: { id },
      relations: ['mascota', 'mascota.dueno', 'mascota.raza', 'mascota.raza.especie', 'veterinario', 'servicio'],
    });
    if (!cita) {
      throw new NotFoundException('La cita solicitada no existe.');
    }
    return this.mapToResponse(cita);
  }

  // --- REPORTES Y AUDITORÍA DE CITAS ---

  async obtenerReporteAnual(anio: number): Promise<any> {
    const inicioAnio = new Date(`${anio}-01-01T00:00:00.000-04:00`);
    const finAnio = new Date(`${anio}-12-31T23:59:59.999-04:00`);

    const citas = await this.citasRepository.find({
      where: {
        fecha_hora_inicio: Between(inicioAnio, finAnio),
      },
      relations: ['veterinario'],
      withDeleted: true, // Incluir citas canceladas o borradas de la base de datos
    });

    const totalCitas = citas.length;
    const noAsistio = citas.filter(c => c.estado === 'No_Asistio').length;
    const completadas = citas.filter(c => c.estado === 'Completada').length;
    const canceladas = citas.filter(c => c.estado === 'Cancelada');

    const porcentajeAbsentismo = totalCitas > 0 ? Number(((noAsistio / totalCitas) * 100).toFixed(2)) : 0;

    // Productividad de médicos (citas completadas por doctor)
    const productividad: Record<string, { id: string; nombreCompleto: string; totalAtendidas: number }> = {};
    citas.forEach(cita => {
      if (cita.estado === 'Completada' && cita.veterinario) {
        const vetId = cita.veterinario.id;
        const nombre = `${cita.veterinario.nombres} ${cita.veterinario.apellidos}`;
        if (!productividad[vetId]) {
          productividad[vetId] = { id: vetId, nombreCompleto: nombre, totalAtendidas: 0 };
        }
        productividad[vetId].totalAtendidas++;
      }
    });

    // Auditoría de motivos de cancelación
    const motivosCancelacion = canceladas.map(c => ({
      citaId: c.id,
      fecha: c.fecha_hora_inicio,
      motivo: c.motivo_cita,
    }));

    return {
      anio,
      totalCitas,
      completadas,
      noAsistio,
      canceladas: canceladas.length,
      porcentajeAbsentismo,
      productividadMedica: Object.values(productividad),
      motivosCancelacion,
    };
  }

  async findPendientesCobro(mascotaId?: string): Promise<any[]> {
    const qb = this.historialRepository.createQueryBuilder('h')
      .leftJoinAndSelect('h.expediente', 'exp')
      .leftJoinAndSelect('exp.mascota', 'mascota')
      .leftJoinAndSelect('mascota.dueno', 'dueno')
      .leftJoinAndSelect('h.cita', 'cita')
      .leftJoinAndSelect('cita.servicio', 'servicio')
      .leftJoinAndSelect('cita.veterinario', 'veterinario')
      .leftJoinAndSelect('h.recetas', 'recetas')
      .leftJoinAndSelect('recetas.detalles', 'detalles')
      .leftJoinAndSelect('detalles.producto', 'producto')
      .leftJoinAndSelect('h.vacunasAplicadas', 'vacunas')
      .leftJoinAndSelect('vacunas.vacuna', 'vacuna')
      .leftJoinAndSelect('vacuna.producto', 'vacunaProducto')
      .where('h.estado IN (:...estados)', { estados: ['Cerrado', 'FINALIZADA'] });

    if (mascotaId) {
      qb.andWhere('exp.id_mascota_fk = :mascotaId', { mascotaId });
    }

    qb.orderBy('h.fecha_consulta', 'DESC');
    const historiales = await qb.getMany();

    return historiales.map(h => {
      const conceptos: { nombre: string; precio: number; cantidad: number }[] = [];

      if (h.cita?.servicio) {
        conceptos.push({
          nombre: h.cita.servicio.nombre,
          precio: Number(h.cita.servicio.precio),
          cantidad: 1,
        });
      }

      for (const receta of h.recetas ?? []) {
        for (const detalle of receta.detalles ?? []) {
          if (detalle.producto) {
            conceptos.push({
              nombre: detalle.producto.nombre,
              precio: Number(detalle.producto.precioVenta),
              cantidad: 1,
            });
          }
        }
      }

      for (const va of h.vacunasAplicadas ?? []) {
        if (va.vacuna?.producto) {
          conceptos.push({
            nombre: `Vacuna: ${va.vacuna.producto.nombre}`,
            precio: Number(va.vacuna.producto.precioVenta),
            cantidad: 1,
          });
        }
      }

      const total = conceptos.reduce((s, c) => s + c.precio * c.cantidad, 0);

      return {
        id_historial: h.id,
        fecha_consulta: h.fecha_consulta,
        veterinario: h.cita?.veterinario
          ? `${h.cita.veterinario.nombres} ${h.cita.veterinario.apellidos}`
          : null,
        mascota: h.expediente?.mascota
          ? { id: h.expediente.mascota.id, nombre: h.expediente.mascota.nombre }
          : null,
        dueno: h.expediente?.mascota?.dueno
          ? {
              id: h.expediente.mascota.dueno.id,
              nombres: h.expediente.mascota.dueno.nombres,
              apellidos: h.expediente.mascota.dueno.apellidos,
              telefono: h.expediente.mascota.dueno.telefono ?? null,
            }
          : null,
        conceptos,
        total,
      };
    });
  }

  async softDeleteCita(id: string): Promise<void> {
    const cita = await this.citasRepository.findOne({ where: { id } });
    if (!cita) {
      throw new NotFoundException('La cita no existe.');
    }
    await this.citasRepository.softRemove(cita);
  }

  async restaurarCita(id: string): Promise<CitaResponseDto> {
    const cita = await this.citasRepository.findOne({ where: { id }, withDeleted: true });
    if (!cita) {
      throw new NotFoundException('La cita no existe.');
    }
    if (cita.deletedAt === null) {
      throw new BadRequestException('La cita no está eliminada.');
    }
    cita.deletedAt = null;
    const restaurada = await this.citasRepository.save(cita);
    return this.findOne(restaurada.id);
  }

  async crearCitaExpressUrgencia(
    mascotaId: string,
    veterinarioId: string,
    servicioId: number,
    creatorId: string,
  ): Promise<Cita> {
    let servicio = await this.serviciosRepository.findOne({ where: { id: servicioId } });
    if (!servicio && servicioId) {
      servicio = await this.serviciosRepository.findOne({ where: { id: servicioId } });
    }
    if (!servicio) {
      servicio = await this.serviciosRepository.findOne({ where: {} });
    }
    if (!servicio) {
      throw new BadRequestException('No se encontraron servicios configurados en el catálogo clínico.');
    }

    const nuevaCita = this.citasRepository.create({
      fecha_hora_inicio: new Date(),
      duracion_minutos: servicio.duracion_minutos || 30,
      motivo_cita: 'Atención Médica por Urgencia',
      tipo_prioridad: 'Urgente',
      estado: 'En_Curso',
      origen_reserva: 'RECEPCION',
      requiere_confirmacion: false,
      id_mascota_fk: mascotaId,
      id_veterinario_fk: veterinarioId,
      id_servicio_fk: servicio.id,
      createdBy: creatorId,
      updatedBy: creatorId,
    });

    const guardada = await this.citasRepository.save(nuevaCita);
    const citaCompleta = await this.findOne(guardada.id);
    this.citasGateway.emitirCitaCreada(citaCompleta as any);
    return guardada;
  }

  // --- DISPONIBILIDAD DE HORARIOS ---
  async obtenerDisponibilidad(veterinarioId: string, fechaStr: string): Promise<{ hora: string; ocupado: boolean }[]> {
    // 1. Verificar si la fecha entera está bloqueada (feriados, vacaciones)
    const bloqueo = await this.fechasBloqueadasRepository.findOne({
      where: [
        { fecha: fechaStr, id_veterinario_fk: IsNull() },
        { fecha: fechaStr, id_veterinario_fk: veterinarioId },
      ],
    });

    if (bloqueo) {
      return []; // Si está bloqueado, devolvemos un arreglo vacío (no hay horarios)
    }

    // 2. Determinar el día de la semana (1 = Lunes, 7 = Domingo)
    // Usamos las 12:00 PM (mediodía) para evitar que por zonas horarias salte al día anterior
    const dateLocal = new Date(`${fechaStr}T12:00:00.000-04:00`); 
    let diaSemana = dateLocal.getDay();
    if (diaSemana === 0) diaSemana = 7; 

    // 3. Obtener el horario laboral del veterinario para ese día específico
    const horario = await this.horariosRepository.createQueryBuilder('horario')
      .leftJoin('horario.veterinario', 'veterinario')
      .where('veterinario.id = :vetId', { vetId: veterinarioId })
      .andWhere('horario.dia_semana = :diaSemana', { diaSemana })
      .andWhere('horario.activo = true')
      .getOne();

    if (!horario) {
      return []; // El veterinario no trabaja ese día
    }

    // 4. Buscar las citas que YA existen ese día
    const inicioDia = new Date(`${fechaStr}T00:00:00.000-04:00`);
    const finDia = new Date(`${fechaStr}T23:59:59.999-04:00`);

    const citasExistentes = await this.citasRepository.createQueryBuilder('cita')
      .where('cita.id_veterinario_fk = :vetId', { vetId: veterinarioId })
      .andWhere('cita.estado NOT IN (:...estados)', { estados: ['Cancelada', 'No_Asistio', 'Completada'] })
      .andWhere('cita.fecha_hora_inicio >= :inicioDia', { inicioDia })
      .andWhere('cita.fecha_hora_inicio <= :finDia', { finDia })
      .getMany();

    // 5. Generar los "Slots" (intervalos de 30 minutos)
const slots: { hora: string; ocupado: boolean }[] = [];    const duracionSlotMinutos = 30; // Puedes cambiar esto si tus citas estándar duran 15 o 60 min
    
    const [horaInicioH, horaInicioM] = horario.hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horario.hora_fin.split(':').map(Number);

    let horaActual = new Date(inicioDia);
    horaActual.setHours(horaInicioH, horaInicioM, 0, 0);

    const limiteTrabajo = new Date(inicioDia);
    limiteTrabajo.setHours(horaFinH, horaFinM, 0, 0);

    // Iterar creando bloques de 30 minutos hasta que termine su turno
    while (horaActual < limiteTrabajo) {
      const horaFinSlot = new Date(horaActual.getTime() + duracionSlotMinutos * 60000);
      const horaString = `${horaActual.getHours().toString().padStart(2, '0')}:${horaActual.getMinutes().toString().padStart(2, '0')}`;

      // Comprobar colisión: ¿Este slot choca con la duración de alguna cita existente?
      const ocupado = citasExistentes.some(cita => {
        const citaInicio = new Date(cita.fecha_hora_inicio);
        const citaFin = new Date(citaInicio.getTime() + (cita.duracion_minutos * 60000));
        
        // Lógica matemática de colisión de rangos: (Inicio A < Fin B) AND (Fin A > Inicio B)
        return horaActual < citaFin && horaFinSlot > citaInicio;
      });

      slots.push({
        hora: horaString,
        ocupado: ocupado
      });

      // Avanzar al siguiente slot
      horaActual = horaFinSlot;
    }

    return slots;
  }
  
}
