import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitoreoDiario } from './entities/monitoreo_diario.entity';
import { CreateMonitoreoDiarioDto } from './dto/create-monitoreo_diario.dto';
import { UpdateMonitoreoDiarioDto } from './dto/update-monitoreo_diario.dto';
import { MonitoreoDiarioResponseDto } from './dto/monitoreo_diario-response.dto';


@Injectable()
export class MonitoreoDiarioService {
  constructor(
    @InjectRepository(MonitoreoDiario)
    private readonly monitoreoRepo: Repository<MonitoreoDiario>,
  ) {}

  private mapToResponse(monitoreo: MonitoreoDiario): MonitoreoDiarioResponseDto {
    return {
      id: monitoreo.id,
      id_hospitaliza_fk: monitoreo.id_hospitaliza_fk,
      turno: monitoreo.turno,
      temperatura_c: monitoreo.temperaturaC ? Number(monitoreo.temperaturaC) : undefined,
      freq_cardiaca: monitoreo.freqCardiaca ?? undefined,
      freq_respiratoria: monitoreo.freqRespiratoria ?? undefined,
      observaciones: monitoreo.observaciones,
      veterinario: monitoreo.veterinario ? {
        id: monitoreo.veterinario.id,
        nombres: monitoreo.veterinario.nombres,
        apellidos: monitoreo.veterinario.apellidos,
        email: monitoreo.veterinario.email,
      } : undefined,
      fecha_registro: monitoreo.createdAt,
    };
  }

  private async findEntity(id: string): Promise<MonitoreoDiario> {
    const monitoreo = await this.monitoreoRepo.findOne({
      where: { id },
      relations: ['hospitalizacion', 'veterinario'],
    });

    if (!monitoreo) {
      throw new NotFoundException(`Registro de monitoreo con ID ${id} no encontrado.`);
    }

    return monitoreo;
  }

  /**
   * Registrar un monitoreo diario para una mascota hospitalizada
   */
  async create(createDto: CreateMonitoreoDiarioDto, creatorId: string): Promise<MonitoreoDiarioResponseDto> {
    const nuevoMonitoreo = this.monitoreoRepo.create({
      id_hospitaliza_fk: createDto.id_hospitaliza_fk,
      id_veterinario_fk: createDto.id_veterinario_fk,
      turno: createDto.turno ?? 'Mañana',
      temperaturaC: createDto.temperatura_c,
      freqCardiaca: createDto.freq_cardiaca,
      freqRespiratoria: createDto.freq_respiratoria,
      observaciones: createDto.observaciones,
      createdBy: creatorId,
      createdByUser: { id: creatorId } as any,
    });

    const guardado = await this.monitoreoRepo.save(nuevoMonitoreo);
    return this.findOne(guardado.id);
  }

  /**
   * Listar todos los registros de monitoreo clínico
   */
  async findAll(): Promise<MonitoreoDiarioResponseDto[]> {
    const monitoreos = await this.monitoreoRepo.find({
      relations: ['hospitalizacion', 'veterinario'],
      order: { createdAt: 'DESC' },
    });
    return monitoreos.map(m => this.mapToResponse(m));
  }

  /**
   * Obtener todos los monitoreos de una hospitalización específica
   */
  async findByHospitalizacion(idHospitalizacion: string): Promise<MonitoreoDiarioResponseDto[]> {
    const monitoreos = await this.monitoreoRepo.find({
      where: { id_hospitaliza_fk: idHospitalizacion },
      relations: ['veterinario'],
      order: { createdAt: 'DESC' },
    });
    return monitoreos.map(m => this.mapToResponse(m));
  }

  /**
   * Obtener un registro de monitoreo por UUID
   */
  async findOne(id: string): Promise<MonitoreoDiarioResponseDto> {
    const entity = await this.findEntity(id);
    return this.mapToResponse(entity);
  }

  /**
   * Actualizar un registro de monitoreo clínico
   */
  async update(id: string, updateDto: UpdateMonitoreoDiarioDto, updaterId: string): Promise<MonitoreoDiarioResponseDto> {
    const monitoreo = await this.findEntity(id);

    if (updateDto.turno !== undefined) monitoreo.turno = updateDto.turno;
    if (updateDto.temperatura_c !== undefined) monitoreo.temperaturaC = updateDto.temperatura_c;
    if (updateDto.freq_cardiaca !== undefined) monitoreo.freqCardiaca = updateDto.freq_cardiaca;
    if (updateDto.freq_respiratoria !== undefined) monitoreo.freqRespiratoria = updateDto.freq_respiratoria;
    if (updateDto.observaciones !== undefined) monitoreo.observaciones = updateDto.observaciones;
    monitoreo.updatedBy = updaterId;

    const guardado = await this.monitoreoRepo.save(monitoreo);
    return this.findOne(guardado.id);
  }

  /**
   * Soft delete de un registro de monitoreo
   */
  async remove(id: string): Promise<{ mensaje: string }> {
    const monitoreo = await this.findEntity(id);
    await this.monitoreoRepo.softRemove(monitoreo);
    return { mensaje: `Monitoreo clínico con ID ${id} eliminado correctamente.` };
  }
}
