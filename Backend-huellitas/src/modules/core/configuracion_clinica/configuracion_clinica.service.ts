import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionClinica } from './entities/configuracion_clinica.entity';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';
import { CreateConfiguracionClinicaDto } from './dto/create-configuracion_clinica.dto';

@Injectable()
export class ConfiguracionClinicaService extends BaseCrudService<ConfiguracionClinica> {
  constructor(
    @InjectRepository(ConfiguracionClinica)
    private readonly configRepository: Repository<ConfiguracionClinica>,
  ) {
    super(configRepository, 'Configuración');
  }

  // Fíjate cómo recibimos el UUID del administrador y lo inyectamos al DTO
  async updateByClave(clave: string, valor: string, descripcion: string | undefined, adminId: string) {
    const config = await this.configRepository.findOne({ where: { clave } });
    if (!config) throw new NotFoundException(`Configuración con clave '${clave}' no encontrada`);
    config.valor = valor;
    if (descripcion !== undefined) config.descripcion = descripcion;
    config.updatedBy = adminId;
    return this.configRepository.save(config);
  }

  async createConfig(createDto: CreateConfiguracionClinicaDto, adminId: string) {
    const dataToSave = {
      ...createDto,
      createdBy: adminId, // ¡Aquí satisfacemos a la base de datos!
    };
    return super.create(dataToSave, { key: 'clave' as keyof ConfiguracionClinica, value: createDto.clave });
  }
}