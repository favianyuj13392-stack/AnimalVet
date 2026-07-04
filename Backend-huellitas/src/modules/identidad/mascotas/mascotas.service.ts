import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Mascota } from './entities/mascota.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Raza } from '../../core/razas/entities/raza.entity';
import { Especie } from '../../core/especies/entities/especie.entity';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { CreateUrgenciaDto } from './dto/create-urgencia.dto';
import { MascotaResponseDto } from './dto/mascotas-response.dto';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';
import { ExpedienteClinicoService } from '../../clinica/expediente_clinico/expediente_clinico.service';
import { CitasService } from '../../clinica/citas/citas.service';
import { LogsSistemaService } from '../../core/logs_sistema/logs_sistema.service';
import { Cita } from '../../clinica/citas/entities/cita.entity';
import { Hospitalizacion } from '../../clinica/hospitalizaciones/entities/hospitalizacione.entity';
import { HistorialClinico } from '../../clinica/historial_clinico/entities/historial_clinico.entity';
import { ExpedienteClinico } from '../../clinica/expediente_clinico/entities/expediente_clinico.entity';

@Injectable()
export class MascotasService extends BaseCrudService<Mascota> {
  constructor(
    @InjectRepository(Mascota)
    private readonly mascotaRepository: Repository<Mascota>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Raza)
    private readonly razaRepository: Repository<Raza>,
    @InjectRepository(Especie)
    private readonly especieRepository: Repository<Especie>,
    private readonly expedienteService: ExpedienteClinicoService,
    private readonly citasService: CitasService,
    private readonly logsService: LogsSistemaService,
  ) {
    super(mascotaRepository, 'Mascota');
  }

  async findOrCreateWildcardUser(): Promise<Usuario> {
    let user = await this.usuarioRepository.findOne({ where: { email: 'urgencias@huellitas.com' } });
    if (!user) {
      const newUser = this.usuarioRepository.create({
        nombres: 'Cliente Genérico',
        apellidos: 'de Urgencias',
        email: 'urgencias@huellitas.com',
        password_hash: '$2b$12$WildcardUserPlaceholderPasswordHashDoNotUseToLogIn',
        telefono: '987654321',
        id_rol_fk: 4, // Cliente
      });
      user = await this.usuarioRepository.save(newUser);
    }
    return user;
  }

  async getOrCreateGenericRaza(especieNombre: string): Promise<Raza> {
    let especie = await this.especieRepository.findOne({ where: { nombre: especieNombre } });
    if (!especie) {
      especie = this.especieRepository.create({ nombre: especieNombre });
      especie = await this.especieRepository.save(especie);
    }

    let raza = await this.razaRepository.findOne({ where: { id_especie_fk: especie.id, nombre: 'Mestizo' } });
    if (!raza) {
      raza = await this.razaRepository.findOne({ where: { id_especie_fk: especie.id } });
    }
    if (!raza) {
      raza = this.razaRepository.create({
        nombre: 'Mestizo',
        id_especie_fk: especie.id,
      });
      raza = await this.razaRepository.save(raza);
    }
    return raza;
  }

  async crearUrgencia(dto: CreateUrgenciaDto, creatorId: string): Promise<any> {
    const wildcardUser = await this.findOrCreateWildcardUser();
    const genericRaza = await this.getOrCreateGenericRaza(dto.especie_nombre);
    const hashQr = 'EMERG-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    const nombreFinal = dto.nombre && dto.nombre.trim() !== '' ? dto.nombre : 'Desconocido Urgente';

    const nuevaMascota = this.mascotaRepository.create({
      nombre: nombreFinal,
      fecha_nacimiento: new Date(),
      sexo: dto.sexo || 'M',
      hash_qr_identidad: hashQr,
      id_dueno_fk: wildcardUser.id,
      id_raza_fk: genericRaza.id,
      url_perfil_publico: `Contacto: ${dto.contacto_nombre} - ${dto.contacto_telefono}`,
      createdBy: creatorId,
    });

    const mascotaGuardada = await this.mascotaRepository.save(nuevaMascota);

    await this.expedienteService.create({
      id_mascota_fk: mascotaGuardada.id,
      notas_generales: `Expediente de emergencia abierto para ${mascotaGuardada.nombre}. Contacto: ${dto.contacto_nombre} (${dto.contacto_telefono})`,
    }, creatorId);

    const cita = await this.citasService.crearCitaExpressUrgencia(
      mascotaGuardada.id,
      dto.id_veterinario,
      dto.id_servicio || 1,
      creatorId
    );

    return {
      mensaje: 'Pre-registro de urgencia completado con éxito.',
      mascotaId: mascotaGuardada.id,
      hashQr: mascotaGuardada.hash_qr_identidad,
      citaId: cita.id,
      redirectUrl: `/vet/consulta/nueva?cita=${cita.id}`,
    };
  }

  async vincularMascotas(idTemporal: string, idReal: string, adminId: string): Promise<any> {
    const mascotaTemp = await this.mascotaRepository.findOne({ where: { id: idTemporal } });
    if (!mascotaTemp) {
      throw new NotFoundException('La mascota temporal no existe.');
    }

    const mascotaReal = await this.mascotaRepository.findOne({ where: { id: idReal } });
    if (!mascotaReal) {
      throw new NotFoundException('La mascota de destino no existe.');
    }

    const expTemp = await this.expedienteService.findByMascota(idTemporal).catch(() => null);
    const expReal = await this.expedienteService.findByMascota(idReal).catch(() => null);

    if (!expReal) {
      throw new NotFoundException('El expediente de la mascota real no existe.');
    }

    // 1. Migrar citas
    const citaRepo = this.mascotaRepository.manager.getRepository(Cita);
    await citaRepo.update({ id_mascota_fk: idTemporal }, { id_mascota_fk: idReal, updatedBy: adminId });

    // 2. Migrar hospitalizaciones
    const hospRepo = this.mascotaRepository.manager.getRepository(Hospitalizacion);
    await hospRepo.update({ id_mascota_fk: idTemporal }, { id_mascota_fk: idReal, updatedBy: adminId });

    // 3. Migrar historiales clínicos si hay expediente temporal
    if (expTemp) {
      const histRepo = this.mascotaRepository.manager.getRepository(HistorialClinico);
      await histRepo.update({ id_expediente_fk: expTemp.id }, { id_expediente_fk: expReal.id, updatedBy: adminId });

      // Eliminar expediente temporal
      const expRepo = this.mascotaRepository.manager.getRepository(ExpedienteClinico);
      await expRepo.delete(expTemp.id);
    }

    // 4. Eliminar mascota temporal
    await this.mascotaRepository.delete(idTemporal);

    await this.logsService.registrar({
      usuarioId: adminId,
      accion: 'MASCOTAS_FUSIONADAS',
      categoria: 'CLINICO',
      tablaAfectada: 'mascotas',
      registroId: idReal,
      detalles: { idTemporal, idReal },
    });

    return {
      mensaje: 'Fusión de perfiles completada. Registros clínicos y hospitalizaciones migrados exitosamente.',
      mascotaRealId: idReal,
    };
  }

  async findOneClean(id: string): Promise<MascotaResponseDto> {
    const mascota = await this.mascotaRepository.findOne({
      where: { id },
      relations: ['dueno', 'raza', 'raza.especie'],
    });
    if (!mascota) {
      throw new Error(`Mascota con ID ${id} no encontrada`);
    }
    return MascotaResponseDto.fromEntity(mascota);
  }

  async createMascota(createDto: CreateMascotaDto, creatorId: string): Promise<MascotaResponseDto> {
    const hashQr = 'MASC-' + crypto.randomBytes(6).toString('hex').toUpperCase();

    const nuevaMascota = this.mascotaRepository.create({
      ...createDto,
      hash_qr_identidad: hashQr,
      createdBy: creatorId 
    });

    const mascotaGuardada = await this.mascotaRepository.save(nuevaMascota);

    await this.expedienteService.create({
      id_mascota_fk: mascotaGuardada.id,
      notas_generales: `Expediente abierto automáticamente por el sistema para ${mascotaGuardada.nombre}.`,
    }, creatorId);

    await this.logsService.registrar({
      usuarioId: creatorId,
      accion: 'MASCOTA_CREADA',
      categoria: 'CLINICO',
      tablaAfectada: 'mascotas',
      registroId: mascotaGuardada.id,
      detalles: { nombre: mascotaGuardada.nombre, hashQr: mascotaGuardada.hash_qr_identidad },
    });

    return MascotaResponseDto.fromEntity(mascotaGuardada);
  }

  // ── RF-25 | HU-26 — Portal cliente: listar mis mascotas ────────────────────
  async findMisMascotas(duenoId: string): Promise<MascotaResponseDto[]> {
    const mascotas = await this.mascotaRepository.find({
      where: { id_dueno_fk: duenoId },
      relations: ['dueno', 'raza', 'raza.especie'],
      order: { createdAt: 'DESC' } as any,
    });
    return MascotaResponseDto.fromEntities(mascotas);
  }

  async findAllClean(search?: string, soloActivos?: boolean): Promise<MascotaResponseDto[]> {
    const qb = this.mascotaRepository.createQueryBuilder('mascota')
      .leftJoinAndSelect('mascota.dueno', 'dueno')
      .leftJoinAndSelect('mascota.raza', 'raza')
      .leftJoinAndSelect('raza.especie', 'especie');

    if (search && search.trim() !== '') {
      const term = `%${search.trim().toLowerCase()}%`;
      qb.andWhere('(LOWER(mascota.nombre) LIKE :term OR LOWER(mascota.hash_qr_identidad) LIKE :term)', { term });
    }

    if (soloActivos) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      qb.andWhere(qbSub => {
        const subCita = qbSub.subQuery()
          .select('1')
          .from(Cita, 'cita')
          .where('cita.id_mascota_fk = mascota.id')
          .andWhere('cita.estado IN (:...cStates)', { cStates: ['Pendiente', 'En_Curso'] })
          .andWhere('cita.fecha_hora_inicio BETWEEN :todayStart AND :todayEnd', { todayStart, todayEnd })
          .getQuery();

        const subHosp = qbSub.subQuery()
          .select('1')
          .from(Hospitalizacion, 'hosp')
          .where('hosp.id_mascota_fk = mascota.id')
          .andWhere('(hosp.fechaAlta IS NULL OR hosp.estadoActual != :altaState)', { altaState: 'Alta' })
          .getQuery();

        return `(EXISTS (${subCita}) OR EXISTS (${subHosp}))`;
      });
    }

    const mascotas = await qb.getMany();
    return MascotaResponseDto.fromEntities(mascotas);
  }

  async obtenerEstadisticasMensuales(veterinarioId: string): Promise<any> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const histRepo = this.mascotaRepository.manager.getRepository(HistorialClinico);

    const historiales = await histRepo.createQueryBuilder('historial')
      .innerJoinAndSelect('historial.expediente', 'expediente')
      .innerJoinAndSelect('expediente.mascota', 'mascota')
      .innerJoinAndSelect('mascota.raza', 'raza')
      .innerJoinAndSelect('raza.especie', 'especie')
      .where('historial.id_veterinario_fk = :veterinarioId', { veterinarioId })
      .andWhere('historial.fecha_consulta BETWEEN :firstDayOfMonth AND :lastDayOfMonth', { firstDayOfMonth, lastDayOfMonth })
      .getMany();

    const especiesMap: Record<string, number> = {};
    const razasMap: Record<string, number> = {};
    const mascotasUnicas = new Set<string>();

    historiales.forEach(h => {
      const mascota = h.expediente.mascota;
      if (mascota) {
        mascotasUnicas.add(mascota.id);

        const especieNombre = mascota.raza?.especie?.nombre || 'Desconocida';
        especiesMap[especieNombre] = (especiesMap[especieNombre] || 0) + 1;

        const razaNombre = mascota.raza?.nombre || 'Desconocida';
        razasMap[razaNombre] = (razasMap[razaNombre] || 0) + 1;
      }
    });

    const porEspecie = Object.keys(especiesMap).map(especie => ({
      especie,
      cantidad: especiesMap[especie],
    }));

    const porRaza = Object.keys(razasMap).map(raza => ({
      raza,
      cantidad: razasMap[raza],
    }));

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesNombre = meses[today.getMonth()];

    return {
      anio: today.getFullYear(),
      mes: mesNombre,
      totalTratados: mascotasUnicas.size,
      porEspecie,
      porRaza,
    };
  }
}
