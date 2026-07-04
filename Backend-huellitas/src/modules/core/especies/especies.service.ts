import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Especie } from './entities/especie.entity';
import { CreateEspecieDto } from './dto/create-especie.dto';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';

@Injectable()
export class EspeciesService extends BaseCrudService<Especie> {
  constructor(
    @InjectRepository(Especie)
    private readonly especieRepository: Repository<Especie>,
  ) {
    // Llamamos al constructor de la clase padre pasándole el repo y el nombre
    super(especieRepository, 'Especie');
  }

  // ¡Y LISTO! Ya tienes findAll, findOne, update y remove funcionando gratis.

  override async findAll(): Promise<Especie[]> {
    return await this.especieRepository.find({ withDeleted: true });
  }

  // Solo si necesitas sobrescribir algo específico, lo haces aquí.
  // Por ejemplo, el create con validación de duplicado (RF-05):
  async createEspecie(createEspecieDto: CreateEspecieDto) {
    return super.create(createEspecieDto, { key: 'nombre' as keyof Especie, value: createEspecieDto.nombre });
  }
}