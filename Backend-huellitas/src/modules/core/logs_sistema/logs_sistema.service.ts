import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogSistema } from './entities/logs_sistema.entity';

export interface RegistrarLogDto {
  usuarioId?: string;
  accion: string;
  categoria: 'SEGURIDAD' | 'CLINICO' | 'INVENTARIO' | 'FINANZAS' | 'SISTEMA';
  tablaAfectada?: string;
  registroId?: string;
  detalles?: Record<string, any>;
}

@Injectable()
export class LogsSistemaService {
  constructor(
    @InjectRepository(LogSistema)
    private readonly logRepo: Repository<LogSistema>,
  ) {}

  async registrar(data: RegistrarLogDto): Promise<void> {
    try {
      await this.logRepo.save(
        this.logRepo.create({
          idUsuarioFk: data.usuarioId ?? null,
          accion: data.accion,
          categoria: data.categoria,
          tablaAfectada: data.tablaAfectada ?? null,
          registroId: data.registroId ?? null,
          detalles: data.detalles ?? null,
        }),
      );
    } catch {
      // Los logs nunca deben interrumpir el flujo principal
    }
  }

  async findByUsuario(usuarioId: string): Promise<LogSistema[]> {
    return this.logRepo.find({
      where: { idUsuarioFk: usuarioId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async findByCategoria(categoria: string): Promise<LogSistema[]> {
    return this.logRepo.find({
      where: { categoria },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async findRecientes(limite = 50): Promise<LogSistema[]> {
    return this.logRepo.find({
      order: { createdAt: 'DESC' },
      take: limite,
      relations: ['usuario'],
    });
  }
}
