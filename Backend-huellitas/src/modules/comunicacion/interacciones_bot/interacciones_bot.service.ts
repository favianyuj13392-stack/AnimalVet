import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InteraccionBot } from './entities/interacciones_bot.entity';

export interface RegistrarInteraccionDto {
  numeroWhatsapp: string;
  mensajeUsuario: string;
  intencionDetectada: string;
  respuestaBot: string;
  clienteId?: string;
  citaGeneradaId?: string;
}

@Injectable()
export class InteraccionesBotService {
  constructor(
    @InjectRepository(InteraccionBot)
    private readonly repo: Repository<InteraccionBot>,
  ) {}

  async registrarInteraccion(dto: RegistrarInteraccionDto): Promise<InteraccionBot> {
    const interaccion = new InteraccionBot();
    interaccion.sesionId = dto.numeroWhatsapp + '_' + Date.now();
    interaccion.numeroWhatsapp = dto.numeroWhatsapp;
    interaccion.mensajeUsuario = dto.mensajeUsuario;
    interaccion.intencionDetectada = dto.intencionDetectada;
    interaccion.respuestaBot = dto.respuestaBot;
    interaccion.id_cliente_fk = dto.clienteId as string;
    interaccion.id_cita_generada_fk = dto.citaGeneradaId as string;
    return this.repo.save(interaccion);
  }

  async findAll(): Promise<InteraccionBot[]> {
    return this.repo.find({
      relations: ['cliente', 'citaGenerada'],
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async findOne(id: string): Promise<InteraccionBot> {
    const interaccion = await this.repo.findOne({
      where: { id },
      relations: ['cliente', 'citaGenerada'],
    });
    if (!interaccion) throw new NotFoundException(`Interacción ${id} no encontrada.`);
    return interaccion;
  }

  async obtenerPorNumero(numeroWhatsapp: string): Promise<InteraccionBot[]> {
    return this.repo.find({
      where: { numeroWhatsapp },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
