import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import Twilio from 'twilio';
import { RegistroNotificacion } from '../registro_notificaciones/entities/registro_notificacione.entity';

@Injectable()
export class MensajeroService {
  private readonly logger = new Logger(MensajeroService.name);

  constructor(
    @InjectRepository(RegistroNotificacion)
    private readonly notifRepo: Repository<RegistroNotificacion>,
  ) {}

  // ── Envía una notificación ya registrada en BD ───────────────────────────────
  async enviar(notificacionId: string): Promise<void> {
    const notif = await this.notifRepo.findOne({ where: { id: notificacionId } });
    if (!notif) {
      this.logger.error(`Notificación ${notificacionId} no encontrada.`);
      return;
    }

    try {
      if (notif.canalEnvio === 'WhatsApp') {
        await this.enviarWhatsApp(notif.cuerpoMensaje);
      } else if (notif.canalEnvio === 'Email') {
        await this.enviarEmail(notif.cuerpoMensaje, notif.tipoNotificacion);
      }
      await this.notifRepo.update(notificacionId, { estadoEnvio: 'Enviado' });
    } catch (err) {
      this.logger.error(`Error enviando notificación ${notificacionId}: ${err.message}`);
      await this.notifRepo.update(notificacionId, { estadoEnvio: 'Error' });
    }
  }

  // ── Envía WhatsApp vía Twilio ─────────────────────────────────────────────────
  async enviarWhatsAppDirecto(telefono: string, mensaje: string): Promise<void> {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from  = process.env.TWILIO_WHATSAPP_FROM; // ej: whatsapp:+14155238886

    if (!sid || !token || !from) {
      this.logger.warn('Twilio no configurado: faltan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_WHATSAPP_FROM');
      return;
    }

    // Normalizar número al formato whatsapp:+591XXXXXXX
    const numero = telefono.replace(/[\s\-\(\)]/g, '');
    const to = numero.startsWith('whatsapp:') ? numero : `whatsapp:+${numero.replace(/^\+/, '')}`;

    const client = Twilio(sid, token);
    const msg = await client.messages.create({ from, to, body: mensaje });

    this.logger.log(`WhatsApp Twilio enviado a ${to} — SID: ${msg.sid}`);
  }

  // ── Envía Email vía Nodemailer (Gmail) ───────────────────────────────────────
  async enviarEmailDirecto(destinatario: string, asunto: string, cuerpo: string, attachments?: any[]): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? `"Animal Vet" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      html: this.wrapHtml(cuerpo),
      attachments,
    });

    this.logger.log(`Email enviado a ${destinatario}`);
  }

  // ── Métodos internos — parsean el formato DEST:destino\ncuerpo ───────────────
  private async enviarWhatsApp(mensaje: string): Promise<void> {
    const match = mensaje.match(/^DEST:(\S+)\n([\s\S]+)$/);
    if (!match) throw new Error('Formato WhatsApp incorrecto (falta DEST:numero)');
    await this.enviarWhatsAppDirecto(match[1], match[2].trim());
  }

  private async enviarEmail(mensaje: string, asunto: string): Promise<void> {
    const match = mensaje.match(/^DEST:(\S+)\n([\s\S]+)$/);
    if (!match) throw new Error('Formato Email incorrecto (falta DEST:email)');
    await this.enviarEmailDirecto(match[1], asunto, match[2].trim());
  }

  private wrapHtml(texto: string): string {
    const cuerpo = texto.replace(/\n/g, '<br>');
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="background:#1a3a5c; padding: 16px; border-radius: 6px 6px 0 0; text-align: center;">
          <h1 style="color:white; margin:0; font-size:20px;">🐾 Animal Vet</h1>
        </div>
        <div style="padding: 24px; color: #374151; line-height: 1.6;">
          ${cuerpo}
        </div>
        <div style="text-align:center; padding: 12px; color: #9ca3af; font-size: 12px;">
          Este mensaje fue generado automáticamente por el sistema de gestión de Animal Vet.
        </div>
      </div>`;
  }
}
