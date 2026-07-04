import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroNotificacion } from './entities/registro_notificacione.entity';

type CanalEnvio = 'WhatsApp' | 'Email' | 'SMS';

export interface CrearNotificacionDto {
  tipoNotificacion: string;
  canalEnvio: CanalEnvio;
  cuerpoMensaje: string;
  idUsuarioFk?: string;
  idCitaFk?: string;
  idMascotaFk?: string;
}

@Injectable()
export class RegistroNotificacionesService {

  constructor(
    @InjectRepository(RegistroNotificacion)
    private readonly notifRepo: Repository<RegistroNotificacion>,
  ) {}

  // ── RF-17 | HU-12 — Crear notificación en cola (Pendiente) ─────────────────
  async registrar(dto: CrearNotificacionDto): Promise<RegistroNotificacion> {
    const notificacion = this.notifRepo.create({
      tipoNotificacion: dto.tipoNotificacion,
      canalEnvio: dto.canalEnvio,
      cuerpoMensaje: dto.cuerpoMensaje,
      estadoEnvio: 'Pendiente',
      idUsuarioFk: dto.idUsuarioFk ?? null,
      idCitaFk: dto.idCitaFk ?? null,
      idMascotaFk: dto.idMascotaFk ?? null,
    });
    return this.notifRepo.save(notificacion);
  }

  // ── Listado general con filtros ─────────────────────────────────────────────
  async findAll(estado?: string): Promise<RegistroNotificacion[]> {
    const where: any = {};
    if (estado) where.estadoEnvio = estado;
    return this.notifRepo.find({
      where,
      relations: ['usuario', 'mascota'],
      order: { createdAt: 'DESC' },
      take: 300,
    });
  }

  async findOne(id: string): Promise<RegistroNotificacion> {
    const notif = await this.notifRepo.findOne({
      where: { id },
      relations: ['usuario', 'mascota', 'cita'],
    });
    if (!notif) throw new NotFoundException('Notificación no encontrada.');
    return notif;
  }
}
