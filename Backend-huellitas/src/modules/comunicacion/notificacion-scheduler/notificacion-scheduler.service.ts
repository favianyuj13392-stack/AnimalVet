import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cita } from '../../clinica/citas/entities/cita.entity';
import { ConfiguracionClinica } from '../../core/configuracion_clinica/entities/configuracion_clinica.entity';
import { ReportesService } from '../../reportes/reportes.service';
import { RegistroNotificacionesService } from '../registro_notificaciones/registro_notificaciones.service';
import { MensajeroService } from '../mensajero/mensajero.service';

@Injectable()
export class NotificacionSchedulerService {
  private readonly logger = new Logger(NotificacionSchedulerService.name);

  constructor(
    private readonly reportesService: ReportesService,
    private readonly notifService: RegistroNotificacionesService,
    private readonly mensajero: MensajeroService,
    @InjectRepository(Cita) private readonly citaRepo: Repository<Cita>,
    @InjectRepository(ConfiguracionClinica) private readonly configRepo: Repository<ConfiguracionClinica>,
  ) {}

  private async canalesActivos(): Promise<{ whatsapp: boolean; email: boolean }> {
    const configs = await this.configRepo.find();
    const map: Record<string, string> = {};
    configs.forEach(c => { map[c.clave] = c.valor; });
    return {
      whatsapp: map['notificaciones_whatsapp'] !== 'false',
      email:    map['notificaciones_email']    !== 'false',
    };
  }

  // ── HU-31 | Recordatorio de vacunas — diario 9am ─────────────────────────────
  @Cron('0 9 * * *', { name: 'recordatorio-vacunas', timeZone: 'America/La_Paz' })
  async recordatorioVacunas(): Promise<void> {
    this.logger.log('Ejecutando recordatorio de vacunas...');
    try {
      const canales = await this.canalesActivos();
      const resultado = await this.reportesService.obtenerVacunasPendientes(7);
      const vacunas: any[] = resultado.vacunas_pendientes ?? [];

      for (const v of vacunas) {
        if (!v.dueno) continue;
        const { nombres, apellidos, telefono, email } = v.dueno;
        const nombreMascota = v.mascota?.nombre ?? 'su mascota';
        const nombreVacuna = v.vacuna ?? 'vacuna';
        const fecha = v.fecha_proxima_dosis
          ? new Date(v.fecha_proxima_dosis).toLocaleDateString('es-BO')
          : 'próximamente';

        const mensaje =
          `Hola ${nombres} ${apellidos}, le recordamos que ${nombreMascota} debe recibir la vacuna ` +
          `*${nombreVacuna}* el *${fecha}*.\n\n` +
          `Puede agendar su cita escribiéndonos o ingresando al sistema. ` +
          `¡La salud de su mascota es nuestra prioridad! 🐾`;

        if (canales.whatsapp && telefono) {
          await this.registrarYEnviar('Recordatorio Vacuna', 'WhatsApp', telefono, mensaje, v.dueno?.id);
        }
        if (canales.email && email) {
          await this.registrarYEnviar('Recordatorio Vacuna', 'Email', email, mensaje, v.dueno?.id);
        }
      }

      this.logger.log(`Recordatorio vacunas: ${vacunas.length} notificaciones procesadas.`);
    } catch (err) {
      this.logger.error(`Error en recordatorio de vacunas: ${err.message}`);
    }
  }

  // ── HU-12 | Recordatorio de citas del día siguiente — diario 8am ────────────
  @Cron('0 8 * * *', { name: 'recordatorio-citas', timeZone: 'America/La_Paz' })
  async recordatorioCitas(): Promise<void> {
    this.logger.log('Ejecutando recordatorio de citas...');
    try {
      const canales = await this.canalesActivos();
      // Para pruebas: busca citas de hoy Y mañana
      const hoy = new Date();
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
      const fin = new Date(manana.getFullYear(), manana.getMonth(), manana.getDate(), 23, 59, 59);

      const citas = await this.citaRepo.find({
        where: { fecha_hora_inicio: Between(inicio, fin), estado: 'Pendiente' },
        relations: ['mascota', 'mascota.dueno', 'veterinario', 'servicio'],
      });

      for (const cita of citas) {
        const dueno = cita.mascota?.dueno;
        if (!dueno) continue;

        const hora = new Date(cita.fecha_hora_inicio).toLocaleTimeString('es-BO', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/La_Paz',
        });
        const vet = cita.veterinario
          ? `Dr(a). ${cita.veterinario.nombres} ${cita.veterinario.apellidos}`
          : 'el veterinario asignado';
        const servicio = cita.servicio?.nombre ?? 'consulta';
        const nombreMascota = cita.mascota?.nombre ?? 'su mascota';

        const mensaje =
          `🐾 *Recordatorio de Cita — Animal Vet*\n\n` +
          `Hola ${dueno.nombres}, le recordamos que *${nombreMascota}* tiene una cita mañana:\n\n` +
          `📅 Fecha: *mañana* a las *${hora}*\n` +
          `🏥 Servicio: ${servicio}\n` +
          `👨‍⚕️ Veterinario: ${vet}\n\n` +
          `Si necesita cancelar o reagendar, contáctenos con anticipación.`;

        if (canales.whatsapp && dueno.telefono) {
          await this.registrarYEnviar('Recordatorio Cita', 'WhatsApp', dueno.telefono, mensaje, dueno.id, cita.id);
        }
        if (canales.email && dueno.email) {
          await this.registrarYEnviar('Recordatorio Cita', 'Email', dueno.email, mensaje, dueno.id, cita.id);
        }
      }

      this.logger.log(`Recordatorio citas: ${citas.length} notificaciones procesadas.`);
    } catch (err) {
      this.logger.error(`Error en recordatorio de citas: ${err.message}`);
    }
  }

  // ── HU-22 | Alerta de stock bajo — lunes 7am ─────────────────────────────────
  @Cron('0 7 * * 1', { name: 'alerta-stock', timeZone: 'America/La_Paz' })
  async alertaStockBajo(): Promise<void> {
    this.logger.log('Ejecutando alerta de stock bajo...');
    try {
      const canales = await this.canalesActivos();
      if (!canales.email) {
        this.logger.log('Notificaciones Email desactivadas — omitiendo alerta de stock.');
        return;
      }
      const reporte = await this.reportesService.obtenerReporteInventario();
      const criticos: any[] = reporte.productos_criticos ?? [];

      if (criticos.length === 0) {
        this.logger.log('Stock OK — sin productos críticos.');
        return;
      }

      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        this.logger.warn('ADMIN_EMAIL no configurado, no se enviará alerta de stock.');
        return;
      }

      const lista = criticos
        .slice(0, 20)
        .map(p => `• ${p.nombre}: stock ${p.stock_actual}/${p.stock_minimo} (faltan ${p.unidades_faltantes})`)
        .join('\n');

      const mensaje =
        `⚠️ *Alerta de Stock Bajo — Animal Vet*\n\n` +
        `Se detectaron *${criticos.length} producto(s)* con stock por debajo del mínimo:\n\n` +
        `${lista}\n\n` +
        `Por favor, realice el reabastecimiento a la brevedad.`;

      await this.registrarYEnviar('Alerta Stock', 'Email', adminEmail, mensaje);
      this.logger.log(`Alerta stock enviada a ${adminEmail}: ${criticos.length} productos críticos.`);
    } catch (err) {
      this.logger.error(`Error en alerta de stock: ${err.message}`);
    }
  }

  // ── Método utilitario: registra en BD y envía ─────────────────────────────────
  private async registrarYEnviar(
    tipo: string,
    canal: 'WhatsApp' | 'Email',
    destino: string,
    texto: string,
    usuarioId?: string,
    citaId?: string,
  ): Promise<void> {
    const cuerpoMensaje = `DEST:${destino}\n${texto}`;

    const notif = await this.notifService.registrar({
      tipoNotificacion: tipo,
      canalEnvio: canal,
      cuerpoMensaje,
      idUsuarioFk: usuarioId,
      idCitaFk: citaId,
    });

    await this.mensajero.enviar(notif.id);
  }

  // ── Ejecución manual para pruebas (llama los 3 jobs al instante) ─────────────
  async ejecutarTodosManual(): Promise<{ vacunas: string; citas: string; stock: string }> {
    await this.recordatorioVacunas();
    await this.recordatorioCitas();
    await this.alertaStockBajo();
    return { vacunas: 'ok', citas: 'ok', stock: 'ok' };
  }
}
