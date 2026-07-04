/* eslint-disable prefer-const */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../modules/identidad/usuarios/entities/usuario.entity';
import { Mascota } from '../../modules/identidad/mascotas/entities/mascota.entity';
import { Servicio } from '../../modules/core/servicios/entities/servicio.entity';
import { CitasService } from '../../modules/clinica/citas/citas.service';
import { InteraccionesBotService } from '../../modules/comunicacion/interacciones_bot/interacciones_bot.service';
import { OrigenReserva } from '../../modules/clinica/citas/dto/create-cita.dto';

interface SesionBot {
  paso: number;
  clienteId?: string;
  mascotaId?: string;
  mascotaNombre?: string;
  servicioId?: number;
  servicioNombre?: string;
  veterinarioId?: string;
  veterinarioNombre?: string;
  fecha?: string;
  horaSeleccionada?: string;
  slotsDisponibles?: string[];
}

const sesiones = new Map<string, SesionBot>();

@Injectable()
export class BotProcesadorService {
  private readonly logger = new Logger(BotProcesadorService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Mascota)
    private readonly mascotaRepo: Repository<Mascota>,
    @InjectRepository(Servicio)
    private readonly servicioRepo: Repository<Servicio>,
    private readonly citasService: CitasService,
    private readonly interaccionesService: InteraccionesBotService,
  ) {}

  async procesarMensaje(numero: string, texto: string): Promise<string> {
    this.logger.log(`📩 Mensaje recibido de ${numero}: "${texto}"`);
    const textoLower = texto.toLowerCase().trim();

    // Buscar cliente por teléfono
    const tel = numero.replace(/^\+/, '');
    const cliente = await this.usuarioRepo.findOne({ where: { telefono: tel } });

    // Cargar sesión actual
    let sesion: SesionBot = sesiones.get(numero) ?? { paso: 0 };
    if (cliente && !sesion.clienteId) sesion.clienteId = cliente.id;

    let respuesta: string;

    // Si hay flujo activo, continuar
    if (sesion.paso > 0) {
      respuesta = await this.continuarFlujo(numero, texto, textoLower, sesion, cliente);
    } else {
      respuesta = await this.manejarIntencion(numero, textoLower, sesion, cliente);
    }

    // Guardar interacción
    await this.interaccionesService.registrarInteraccion({
      numeroWhatsapp: numero,
      mensajeUsuario: texto,
      intencionDetectada: sesion.paso > 0 ? `FLUJO_PASO_${sesion.paso}` : 'INICIO',
      respuestaBot: respuesta,
      clienteId: cliente?.id,
    });

    return respuesta;
  }

  private async manejarIntencion(numero: string, texto: string, sesion: SesionBot, cliente: any): Promise<string> {
    // Detección por palabras clave primero (rápido y confiable)
    const intencionLocal = this.detectarIntencionLocal(texto);

    if (intencionLocal === 'AGENDAR') {
      if (!cliente) {
        return (
          '¡Hola! 👋 No encontramos tu número en nuestro sistema.\n\n' +
          'Para agendar una cita tienes 2 opciones:\n' +
          '1️⃣ Regístrate en el portal web\n' +
          '2️⃣ Visítanos en la clínica y te registramos 🐾'
        );
      }
      return await this.iniciarAgendamiento(numero, sesion, cliente);
    }

    if (intencionLocal === 'HORARIOS') {
      return (
        '🕐 *Horarios de atención — Huellitas Digitales*\n\n' +
        '📅 Lunes a Viernes: 8:00 am – 6:00 pm\n' +
        '📅 Sábados: 8:00 am – 12:00 pm\n' +
        '📅 Domingos: Cerrado\n\n' +
        '¿En qué más puedo ayudarte? 🐾'
      );
    }

    if (intencionLocal === 'SALUDO') {
      const nombre = cliente ? ` ${cliente.nombres}` : '';
      return this.mensajeBienvenida(nombre);
    }

    // Si no detectó nada local, intentar con Gemini
    this.logger.log(`🤖 Llamando a Gemini con: "${texto}"`);
    try {
      const geminiRespuesta = await this.llamarGemini(texto, cliente);
      this.logger.log(`✅ Gemini intención: ${geminiRespuesta.intencion} | respuesta: ${geminiRespuesta.respuesta?.substring(0, 60)}`);

      if (geminiRespuesta.intencion === 'AGENDAR') {
        if (!cliente) {
          return (
            '¡Hola! 👋 No encontramos tu número en nuestro sistema.\n\n' +
            'Para agendar una cita tienes 2 opciones:\n' +
            '1️⃣ Regístrate en el portal web\n' +
            '2️⃣ Visítanos en la clínica y te registramos 🐾'
          );
        }
        return await this.iniciarAgendamiento(numero, sesion, cliente);
      }

      if (geminiRespuesta.intencion === 'HORARIOS') {
        return (
          '🕐 *Horarios de atención — Huellitas Digitales*\n\n' +
          '📅 Lunes a Viernes: 8:00 am – 6:00 pm\n' +
          '📅 Sábados: 8:00 am – 12:00 pm\n' +
          '📅 Domingos: Cerrado\n\n' +
          '¿En qué más puedo ayudarte? 🐾'
        );
      }

      // Para cualquier otra intención, mostrar la respuesta de Gemini directamente
      if (geminiRespuesta.respuesta) {
        this.logger.log(`Gemini respondió: ${geminiRespuesta.respuesta.substring(0, 50)}...`);
        return geminiRespuesta.respuesta;
      }
    } catch (err) {
      this.logger.error(`Gemini falló: ${err.message}`);
    }

    return this.mensajeBienvenida(cliente ? ` ${cliente.nombres}` : '');
  }

  private detectarIntencionLocal(texto: string): string {
    const t = texto.toLowerCase();
    if (/\b(cita|agendar|turno|reservar|vacuna|baño|desparasit|appointment|quiero una cita|quiero agendar)\b/.test(t)) return 'AGENDAR';
    if (/\b(horario|hora|atienden|abren|cierran|cuando|schedule)\b/.test(t)) return 'HORARIOS';
    if (/\b(hola|buenos|buenas|hi|hello|saludos|buen dia|buenas tardes|buenas noches)\b/.test(t)) return 'SALUDO';
    return 'DESCONOCIDO';
  }

  // ── FLUJO DE AGENDAMIENTO ────────────────────────────────────────────────────

  private async iniciarAgendamiento(numero: string, sesion: SesionBot, cliente: any): Promise<string> {
    const mascotas = await this.mascotaRepo.find({ where: { id_dueno_fk: cliente.id } });

    if (mascotas.length === 0) {
      return '⚠️ No tienes mascotas registradas. Visítanos en la clínica para registrar a tu mascota 🐾';
    }

    sesion.paso = 1;
    sesiones.set(numero, sesion);

    const lista = mascotas.map((m, i) => `${i + 1}. ${m.nombre}`).join('\n');
    return `🐾 ¡Hola ${cliente.nombres}! Vamos a agendar tu cita.\n\n¿Para cuál de tus mascotas?\n\n${lista}\n\nResponde con el número.`;
  }

  private async continuarFlujo(numero: string, texto: string, textoLower: string, sesion: SesionBot, cliente: any): Promise<string> {
    // Cancelar en cualquier momento
    if (/\b(cancelar|salir|exit|no quiero|olvida|olvidar|stop|parar)\b/.test(textoLower) || textoLower === 'no') {
      sesiones.delete(numero);
      return '❌ Agendamiento cancelado. ¿En qué más puedo ayudarte? 🐾';
    }

    // Si pregunta algo diferente al flujo, salir del flujo y responder con Gemini
    if (!/^\d+$/.test(textoLower) && sesion.paso <= 3 && !/\d{2}\/\d{2}\/\d{4}/.test(texto)) {
      const intencionLocal = this.detectarIntencionLocal(textoLower);
      if (intencionLocal === 'DESCONOCIDO' || intencionLocal === 'OTRO') {
        sesiones.delete(numero);
        return await this.manejarIntencion(numero, textoLower, { paso: 0 }, cliente);
      }
    }

    switch (sesion.paso) {
      case 1: return await this.paso1Mascota(numero, texto, sesion, cliente);
      case 2: return await this.paso2Servicio(numero, texto, sesion);
      case 3: return await this.paso3Veterinario(numero, texto, sesion);
      case 4: return await this.paso4Fecha(numero, texto, sesion);
      case 5: return await this.paso5Horario(numero, texto, sesion);
      case 6: return await this.paso6Confirmar(numero, textoLower, sesion, cliente);
      default:
        sesiones.delete(numero);
        return this.mensajeBienvenida();
    }
  }

  private async paso1Mascota(numero: string, texto: string, sesion: SesionBot, cliente: any): Promise<string> {
    const mascotas = await this.mascotaRepo.find({ where: { id_dueno_fk: cliente.id } });
    const idx = parseInt(texto) - 1;

    if (isNaN(idx) || !mascotas[idx]) {
      const lista = mascotas.map((m, i) => `${i + 1}. ${m.nombre}`).join('\n');
      return `⚠️ Por favor elige un número válido:\n\n${lista}`;
    }

    sesion.mascotaId = mascotas[idx].id;
    sesion.mascotaNombre = mascotas[idx].nombre;
    sesion.paso = 2;
    sesiones.set(numero, sesion);

    const servicios = await this.servicioRepo.find();
    const lista = servicios.map((s, i) => `${i + 1}. ${s.nombre} (Bs. ${s.precio})`).join('\n');
    return `✅ Mascota: *${sesion.mascotaNombre}*\n\n🏥 ¿Qué servicio necesitas?\n\n${lista}\n\nResponde con el número.`;
  }

  private async paso2Servicio(numero: string, texto: string, sesion: SesionBot): Promise<string> {
    const servicios = await this.servicioRepo.find();
    const idx = parseInt(texto) - 1;

    if (isNaN(idx) || !servicios[idx]) {
      const lista = servicios.map((s, i) => `${i + 1}. ${s.nombre}`).join('\n');
      return `⚠️ Por favor elige un número válido:\n\n${lista}`;
    }

    sesion.servicioId = servicios[idx].id;
    sesion.servicioNombre = servicios[idx].nombre;
    sesion.paso = 3;
    sesiones.set(numero, sesion);

    const vets = await this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('u.rol', 'r')
      .where('r.nombre = :rol', { rol: 'Veterinario' })
      .andWhere('u.estado_cuenta = true')
      .getMany();

    if (vets.length === 0) {
      sesiones.delete(numero);
      return '⚠️ No hay veterinarios disponibles. Por favor llámanos directamente.';
    }

    const lista = vets.map((v, i) => `${i + 1}. Dr(a). ${v.nombres} ${v.apellidos}`).join('\n');
    return `✅ Servicio: *${sesion.servicioNombre}*\n\n👨‍⚕️ ¿Con qué veterinario?\n\n${lista}\n\nResponde con el número.`;
  }

  private async paso3Veterinario(numero: string, texto: string, sesion: SesionBot): Promise<string> {
    const vets = await this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('u.rol', 'r')
      .where('r.nombre = :rol', { rol: 'Veterinario' })
      .andWhere('u.estado_cuenta = true')
      .getMany();

    const idx = parseInt(texto) - 1;
    if (isNaN(idx) || !vets[idx]) {
      const lista = vets.map((v, i) => `${i + 1}. Dr(a). ${v.nombres} ${v.apellidos}`).join('\n');
      return `⚠️ Por favor elige un número válido:\n\n${lista}`;
    }

    sesion.veterinarioId = vets[idx].id;
    sesion.veterinarioNombre = `Dr(a). ${vets[idx].nombres} ${vets[idx].apellidos}`;
    sesion.paso = 4;
    sesiones.set(numero, sesion);

    return (
      `✅ Veterinario: *${sesion.veterinarioNombre}*\n\n` +
      `📅 ¿Para qué fecha quieres la cita?\n\n` +
      `Escribe en formato: *DD/MM/YYYY*\n` +
      `Ejemplo: *15/06/2026*`
    );
  }

  private async paso4Fecha(numero: string, texto: string, sesion: SesionBot): Promise<string> {
    const match = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) {
      return '⚠️ Formato no reconocido. Por favor usa: *DD/MM/YYYY*\nEjemplo: *15/06/2026*';
    }

    const fechaISO = `${match[3]}-${match[2]}-${match[1]}`;
    const fecha = new Date(`${fechaISO}T12:00:00.000-04:00`);

    if (fecha < new Date()) {
      return '⚠️ La fecha no puede ser en el pasado. Por favor elige una fecha futura.';
    }

    // Consultar disponibilidad
    const slots = await this.citasService.obtenerDisponibilidad(sesion.veterinarioId!, fechaISO);
    const disponibles = slots.filter(s => !s.ocupado);

    if (disponibles.length === 0) {
      return (
        `⚠️ No hay horarios disponibles para el *${texto}* con ${sesion.veterinarioNombre}.\n\n` +
        `Por favor elige otra fecha:`
      );
    }

    sesion.fecha = fechaISO;
    sesion.slotsDisponibles = disponibles.map(s => s.hora);
    sesion.paso = 5;
    sesiones.set(numero, sesion);

    const lista = disponibles.map((s, i) => `${i + 1}. ${s.hora}`).join('\n');
    return `📅 Horarios disponibles para el *${texto}*:\n\n${lista}\n\nResponde con el número del horario.`;
  }

  private async paso5Horario(numero: string, texto: string, sesion: SesionBot): Promise<string> {
    const slots = sesion.slotsDisponibles ?? [];
    const idx = parseInt(texto) - 1;

    if (isNaN(idx) || !slots[idx]) {
      const lista = slots.map((s, i) => `${i + 1}. ${s}`).join('\n');
      return `⚠️ Por favor elige un número válido:\n\n${lista}`;
    }

    sesion.horaSeleccionada = slots[idx];
    sesion.paso = 6;
    sesiones.set(numero, sesion);

    return (
      `📋 *Resumen de tu cita:*\n\n` +
      `🐾 Mascota: ${sesion.mascotaNombre}\n` +
      `🏥 Servicio: ${sesion.servicioNombre}\n` +
      `👨‍⚕️ Veterinario: ${sesion.veterinarioNombre}\n` +
      `📅 Fecha: ${sesion.fecha}\n` +
      `🕐 Hora: ${sesion.horaSeleccionada}\n\n` +
      `¿Confirmas la cita? Responde *SI* o *NO*.`
    );
  }

  private async paso6Confirmar(numero: string, texto: string, sesion: SesionBot, cliente: any): Promise<string> {
    const confirma = /^(s[ií]|yes|confirmar|ok|listo|1)$/i.test(texto.trim());

    if (!confirma) {
      sesiones.delete(numero);
      return '❌ Cita cancelada. ¡Cuando quieras agendar escríbeme! 🐾';
    }

    try {
      const [hora, minutos] = sesion.horaSeleccionada!.split(':');
      const fechaHora = new Date(`${sesion.fecha}T${hora}:${minutos}:00.000-04:00`);

      const cita = await this.citasService.create(
        {
          fecha_hora_inicio: fechaHora,
          motivo_cita: `Cita agendada vía WhatsApp Bot — ${sesion.servicioNombre}`,
          origen_reserva: OrigenReserva.BOT_WA,
          id_mascota_fk: sesion.mascotaId!,
          id_veterinario_fk: sesion.veterinarioId!,
          id_servicio_fk: sesion.servicioId!,
        },
        sesion.clienteId!,
      );

      sesiones.delete(numero);

      return (
        `✅ *¡Cita agendada exitosamente!* 🎉\n\n` +
        `🐾 Mascota: ${sesion.mascotaNombre}\n` +
        `🏥 Servicio: ${sesion.servicioNombre}\n` +
        `👨‍⚕️ Veterinario: ${sesion.veterinarioNombre}\n` +
        `📅 Fecha: ${sesion.fecha}\n` +
        `🕐 Hora: ${sesion.horaSeleccionada}\n\n` +
        `Te recordaremos el día anterior. ¡Hasta pronto! 🐾`
      );
    } catch (err) {
      sesiones.delete(numero);
      this.logger.error(`Error creando cita desde bot: ${err.message}`);
      return (
        `⚠️ Hubo un problema al registrar la cita: ${err.message}\n\n` +
        `Por favor intenta de nuevo o llámanos directamente.`
      );
    }
  }

  // ── Gemini para intención inicial ────────────────────────────────────────────
  private async llamarGemini(texto: string, cliente: any): Promise<{ intencion: string; respuesta: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { intencion: 'DESCONOCIDO', respuesta: this.mensajeBienvenida() };

    try {
      const prompt = `Eres el asistente de Huellitas Digitales, clínica veterinaria en Bolivia.
Analiza el mensaje y responde SOLO con JSON sin texto adicional:
{"intencion": "AGENDAR" o "HORARIOS" o "SALUDO" o "OTRO", "respuesta": "texto amigable en español"}
Mensaje: ${texto}`;

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );

      const data = await resp.json() as any;
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
      // Extraer JSON del bloque markdown si Gemini lo envuelve
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const cleanContent = jsonMatch ? jsonMatch[0] : content;
      return JSON.parse(cleanContent);
    } catch (err) {
      this.logger.error(`Gemini error: ${err.message}`);
      return { intencion: 'OTRO', respuesta: this.mensajeBienvenida() };
    }
  }

  private mensajeBienvenida(nombre = ''): string {
    return (
      `🐾 *¡Hola${nombre}! Bienvenido a Huellitas Digitales*\n\n` +
      '¿En qué puedo ayudarte?\n\n' +
      '1️⃣ *Quiero una cita* — Agendar\n' +
      '2️⃣ *Horarios* — Ver horarios de atención\n\n' +
      'Escribe lo que necesitas.'
    );
  }
}
