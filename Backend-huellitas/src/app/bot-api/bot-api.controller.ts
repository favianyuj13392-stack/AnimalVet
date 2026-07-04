import {
  Controller, Get, Post, Delete, Body, Query, Param, Req, UnauthorizedException, Logger,
} from '@nestjs/common';
import { BotProcesadorService } from './bot-procesador.service';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../modules/identidad/usuarios/entities/usuario.entity';
import { Mascota } from '../../modules/identidad/mascotas/entities/mascota.entity';
import { Servicio } from '../../modules/core/servicios/entities/servicio.entity';
import { Usuario as UsuarioEntity } from '../../modules/identidad/usuarios/entities/usuario.entity';
import { CitasService } from '../../modules/clinica/citas/citas.service';
import { InteraccionesBotService } from '../../modules/comunicacion/interacciones_bot/interacciones_bot.service';
import { OrigenReserva } from '../../modules/clinica/citas/dto/create-cita.dto';

function validarBotKey(req: any): void {
  const key = req.headers['x-bot-key'];
  if (!key || key !== process.env.BOT_API_KEY) {
    throw new UnauthorizedException('Bot API Key inválida.');
  }
}

// ── Sesiones en memoria (estado de la conversación por número) ───────────────
const sesiones = new Map<string, any>();

@ApiTags('Bot API — Endpoints para n8n')
@ApiHeader({ name: 'x-bot-key', description: 'API Key del bot', required: true })
@Controller('bot')
export class BotApiController {
  private readonly logger = new Logger(BotApiController.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Mascota)
    private readonly mascotaRepo: Repository<Mascota>,
    @InjectRepository(Servicio)
    private readonly servicioRepo: Repository<Servicio>,
    private readonly citasService: CitasService,
    private readonly interaccionesService: InteraccionesBotService,
    private readonly botProcesador: BotProcesadorService,
  ) {}

  // ── POST /bot/procesar-mensaje ───────────────────────────────────────────────
  @Post('procesar-mensaje')
  @ApiOperation({ summary: 'n8n: Procesa un mensaje de WhatsApp y devuelve la respuesta del bot' })
  async procesarMensaje(@Body() body: any, @Req() req: any) {
    validarBotKey(req);
    const respuesta = await this.botProcesador.procesarMensaje(body.numero, body.texto);
    return { respuesta };
  }

  // ── GET /bot/cliente-por-telefono ────────────────────────────────────────────
  @Get('cliente-por-telefono')
  @ApiOperation({ summary: 'Buscar cliente y sus mascotas por número de WhatsApp' })
  @ApiQuery({ name: 'telefono', required: true })
  async clientePorTelefono(@Query('telefono') telefono: string, @Req() req: any) {
    validarBotKey(req);
    const tel = telefono.replace(/^\+/, '').replace(/\s/g, '');
    const cliente = await this.usuarioRepo.findOne({ where: { telefono: tel } });
    if (!cliente) return { encontrado: false, cliente: null, mascotas: [] };
    const mascotas = await this.mascotaRepo.find({ where: { id_dueno_fk: cliente.id } });
    return {
      encontrado: true,
      cliente: { id: cliente.id, nombres: cliente.nombres, apellidos: cliente.apellidos, email: cliente.email, telefono: cliente.telefono },
      mascotas: mascotas.map(m => ({ id: m.id, nombre: m.nombre })),
    };
  }

  // ── GET /bot/sesion/:numero ──────────────────────────────────────────────────
  @Get('sesion/:numero')
  @ApiOperation({ summary: 'Obtener estado actual de la conversación' })
  getSesion(@Param('numero') numero: string, @Req() req: any) {
    validarBotKey(req);
    const sesion = sesiones.get(numero) ?? { paso: 0 };
    return sesion;
  }

  // ── POST /bot/sesion/:numero ─────────────────────────────────────────────────
  @Post('sesion/:numero')
  @ApiOperation({ summary: 'Guardar estado de la conversación' })
  setSesion(@Param('numero') numero: string, @Body() body: any, @Req() req: any) {
    validarBotKey(req);
    sesiones.set(numero, body);
    return { ok: true };
  }

  // ── DELETE /bot/sesion/:numero ───────────────────────────────────────────────
  @Delete('sesion/:numero')
  @ApiOperation({ summary: 'Limpiar sesión al terminar la conversación' })
  deleteSesion(@Param('numero') numero: string, @Req() req: any) {
    validarBotKey(req);
    sesiones.delete(numero);
    return { ok: true };
  }

  // ── GET /bot/servicios ───────────────────────────────────────────────────────
  @Get('servicios')
  @ApiOperation({ summary: 'Listar servicios disponibles para el bot' })
  async getServicios(@Req() req: any) {
    validarBotKey(req);
    const servicios = await this.servicioRepo.find();
    return servicios.map((s, i) => ({
      numero: i + 1,
      id: s.id,
      nombre: s.nombre,
      precio: Number(s.precio),
      duracion: s.duracion_minutos,
    }));
  }

  // ── GET /bot/veterinarios ────────────────────────────────────────────────────
  @Get('veterinarios')
  @ApiOperation({ summary: 'Listar veterinarios disponibles para el bot' })
  async getVeterinarios(@Req() req: any) {
    validarBotKey(req);
    const vets = await this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoin('u.rol', 'r')
      .where('r.nombre = :rol', { rol: 'Veterinario' })
      .andWhere('u.estado_cuenta = true')
      .getMany();
    return vets.map((v, i) => ({
      numero: i + 1,
      id: v.id,
      nombre: `Dr(a). ${v.nombres} ${v.apellidos}`,
    }));
  }

  // ── POST /bot/registrar-interaccion ─────────────────────────────────────────
  @Post('registrar-interaccion')
  @ApiOperation({ summary: 'Guardar una interacción del bot en la BD' })
  async registrarInteraccion(@Body() body: any, @Req() req: any) {
    validarBotKey(req);
    const interaccion = await this.interaccionesService.registrarInteraccion({
      numeroWhatsapp: body.numeroWhatsapp,
      mensajeUsuario: body.mensajeUsuario,
      intencionDetectada: body.intencionDetectada,
      respuestaBot: body.respuestaBot,
      clienteId: body.clienteId || undefined,
      citaGeneradaId: body.citaId || undefined,
    });
    return { ok: true, id: interaccion.id };
  }

  // ── POST /bot/crear-cita ─────────────────────────────────────────────────────
  @Post('crear-cita')
  @ApiOperation({ summary: 'Crear una cita vía Bot (origen BOT_WA)' })
  async crearCita(@Body() body: any, @Req() req: any) {
    validarBotKey(req);
    const cita = await this.citasService.create(
      {
        fecha_hora_inicio: new Date(body.fecha_hora_inicio),
        motivo_cita: body.motivo_cita ?? 'Cita agendada vía WhatsApp Bot',
        origen_reserva: OrigenReserva.BOT_WA,
        id_mascota_fk: body.id_mascota_fk,
        id_veterinario_fk: body.id_veterinario_fk,
        id_servicio_fk: Number(body.id_servicio_fk),
      },
      body.clienteId,
    );
    this.logger.log(`Cita BOT_WA creada: ${cita.id}`);
    return { ok: true, cita };
  }
}
