import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patologia } from './entities/patologia.entity';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';

@Injectable()
export class PatologiasService extends BaseCrudService<Patologia> {
  constructor(
    @InjectRepository(Patologia)
    private readonly patologiaRepository: Repository<Patologia>,
  ) {
    super(patologiaRepository, 'Patologia');
  }

  async findAllPatologias() {
    return this.patologiaRepository.find({ order: { nombre: 'ASC' } });
  }
}
