import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegistroEscaneoQR } from './entities/registro_escaneos_qr.entity';
import { Mascota } from '../../identidad/mascotas/entities/mascota.entity';
import { RegistroNotificacion } from '../registro_notificaciones/entities/registro_notificacione.entity';

@Injectable()
export class RegistroEscaneoQRService {
  constructor(
    @InjectRepository(RegistroEscaneoQR)
    private readonly escaneoRepo: Repository<RegistroEscaneoQR>,
    @InjectRepository(Mascota)
    private readonly mascotaRepo: Repository<Mascota>,
    @InjectRepository(RegistroNotificacion)
    private readonly notifRepo: Repository<RegistroNotificacion>,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Listar mascotas perdidas para la página pública
  // ──────────────────────────────────────────────────────────────────────────
  async listarMascotasPerdidas(): Promise<any[]> {
    const mascotas = await this.mascotaRepo.find({
      where: { estado_perdido: true },
      relations: ['dueno', 'raza', 'raza.especie'],
      order: { updatedAt: 'DESC' } as any,
    });

    return mascotas.map(m => ({
      id: m.id,
      hash_qr_identidad: m.hash_qr_identidad,
      nombre: m.nombre,
      especie: m.raza?.especie?.nombre ?? 'Desconocida',
      raza: m.raza?.nombre ?? 'Desconocida',
      sexo: m.sexo === 'M' ? 'Macho' : 'Hembra',
      foto_url: m.foto_url ?? null,
      caracteristicas_fisicas: m.caracteristicas_fisicas ?? null,
      // Zona = nombre del punto de entrega o ciudad genérica
      zona: m.punto_entrega_nombre ?? m.punto_entrega_direccion ?? 'La Paz, Bolivia',
      fecha_extravío: m.updatedAt,
      // Solo teléfono de contacto, sin datos personales
      telefono_contacto: m.contacto_emergencia_telefono ?? m.dueno?.telefono ?? null,
      mensaje_encontrador: m.mensaje_encontrador ?? null,
      recompensa: m.recompensa ?? false,
    }));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RF-24 | HU-30 — Endpoint público: registrar escaneo de QR + geolocalización
  // ──────────────────────────────────────────────────────────────────────────
  async registrarEscaneo(
    hash: string,
    latitud?: number,
    longitud?: number,
    userAgent?: string,
  ): Promise<{ mascota: any; escaneo_id: string; notificacion_creada: boolean }> {
    // 1. Buscar la mascota por su hash QR
    const mascota = await this.mascotaRepo.findOne({
      where: { hash_qr_identidad: hash },
      relations: ['dueno', 'raza', 'raza.especie'],
    });

    if (!mascota) {
      throw new NotFoundException('No se encontró ninguna mascota con ese código QR.');
    }

    // 2. Registrar el escaneo
    const nuevoEscaneo = this.escaneoRepo.create({
      id_mascota_fk: mascota.id,
      latitud: latitud ?? null,
      longitud: longitud ?? null,
      user_agent: userAgent ?? null,
      notificacion_enviada: false,
    } as any) as unknown as RegistroEscaneoQR;
    const escaneoGuardado = (await this.escaneoRepo.save(nuevoEscaneo as any)) as unknown as RegistroEscaneoQR;

    // 3. Notificaciones al dueño
    let notificacionCreada = false;
    if (mascota.dueno) {
      const canal = mascota.dueno.telefono ? 'WhatsApp' : 'Email';
      const hora = new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

      if (latitud && longitud) {
        // Notificación con GPS — el encontrador compartió ubicación voluntariamente
        const mapsLink = `https://maps.google.com/?q=${latitud},${longitud}`;
        const mensaje = mascota.estado_perdido
          ? `📍 El encontrador de ${mascota.nombre} está en: Lat ${latitud}, Lng ${longitud}\n→ Ver en Google Maps: ${mapsLink}`
          : `📍 Alguien escaneó el QR de ${mascota.nombre} a las ${hora} y compartió su ubicación.\n→ Ver en Google Maps: ${mapsLink}`;

        const notif = this.notifRepo.create({
          tipoNotificacion: mascota.estado_perdido ? 'MASCOTA_ENCONTRADA' : 'QR_ESCANEADO',
          canalEnvio: canal,
          cuerpoMensaje: mensaje,
          estadoEnvio: 'Pendiente',
          idUsuarioFk: mascota.dueno.id,
          idMascotaFk: mascota.id,
          idCitaFk: null,
        });
        await this.notifRepo.save(notif);
      } else {
        // Notificación simple — alguien escaneó el QR (sin GPS)
        const mensaje = mascota.estado_perdido
          ? `🐾 Alguien escaneó el QR de ${mascota.nombre} a las ${hora}. Espera que te contacten pronto.`
          : `🔔 Alguien escaneó el QR de ${mascota.nombre} a las ${hora}.`;

        const notif = this.notifRepo.create({
          tipoNotificacion: 'QR_ESCANEADO',
          canalEnvio: canal,
          cuerpoMensaje: mensaje,
          estadoEnvio: 'Pendiente',
          idUsuarioFk: mascota.dueno.id,
          idMascotaFk: mascota.id,
          idCitaFk: null,
        });
        await this.notifRepo.save(notif);
      }

      escaneoGuardado.notificacion_enviada = true;
      await this.escaneoRepo.save(escaneoGuardado);
      notificacionCreada = true;
    }

    // 4. Devolver perfil público de la mascota (sin datos médicos sensibles)
    return {
      escaneo_id: escaneoGuardado.id,
      notificacion_creada: notificacionCreada,
      mascota: this.mapPerfilPublico(mascota),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RF-24 | HU-27 — Obtener perfil público de mascota por hash QR
  // ──────────────────────────────────────────────────────────────────────────
  async obtenerPerfilPublico(hash: string): Promise<any> {
    const mascota = await this.mascotaRepo.findOne({
      where: { hash_qr_identidad: hash },
      relations: ['dueno', 'raza', 'raza.especie'],
    });

    if (!mascota) {
      throw new NotFoundException('No se encontró ninguna mascota con ese código QR.');
    }

    return this.mapPerfilPublico(mascota);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Listado de escaneos de una mascota (para admin/vet)
  // ──────────────────────────────────────────────────────────────────────────
  async obtenerPorMascota(mascotaId: string): Promise<RegistroEscaneoQR[]> {
    return this.escaneoRepo.find({
      where: { id_mascota_fk: mascotaId },
      order: { createdAt: 'DESC' },
    });
  }

  async obtenerTodos(): Promise<RegistroEscaneoQR[]> {
    return this.escaneoRepo.find({
      relations: ['mascota'],
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Privado: mapea solo los datos públicos de la mascota
  // ──────────────────────────────────────────────────────────────────────────
  private mapPerfilPublico(mascota: Mascota): any {
    const telefonoContacto = mascota.contacto_emergencia_telefono
      ?? mascota.dueno?.telefono
      ?? null;

    return {
      id: mascota.id,
      nombre: mascota.nombre,
      especie: mascota.raza?.especie?.nombre ?? 'Desconocida',
      raza: mascota.raza?.nombre ?? 'Desconocida',
      sexo: mascota.sexo === 'M' ? 'Macho' : 'Hembra',
      esterilizado: mascota.esterilizado,
      estado_perdido: mascota.estado_perdido,
      foto_url: mascota.foto_url ?? null,
      caracteristicas_fisicas: mascota.caracteristicas_fisicas ?? null,
      // Contacto: solo primer nombre del dueño + teléfono, sin apellido ni email
      contacto_dueno: mascota.dueno
        ? {
            nombre: mascota.dueno.nombres,
            telefono: telefonoContacto,
          }
        : null,
      // Punto de entrega definido por el dueño
      punto_entrega: mascota.punto_entrega_nombre ? {
        nombre: mascota.punto_entrega_nombre,
        direccion: mascota.punto_entrega_direccion,
        referencia: mascota.punto_entrega_referencia ?? null,
        lat: mascota.punto_entrega_lat ?? null,
        lng: mascota.punto_entrega_lng ?? null,
      } : null,
      recompensa: mascota.recompensa ?? false,
      mensaje_encontrador: mascota.mensaje_encontrador ?? null,
    };
  }
}
