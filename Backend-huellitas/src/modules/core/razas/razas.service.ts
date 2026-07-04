import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Raza } from './entities/raza.entity';
import { CreateRazaDto } from './dto/create-raza.dto';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';
// Importamos el servicio de la tabla "vecina"
import { EspeciesService } from '../especies/especies.service';

@Injectable()
export class RazasService extends BaseCrudService<Raza> {
  constructor(
    @InjectRepository(Raza)
    private readonly razaRepository: Repository<Raza>,
    // Inyectamos el servicio de especies para validar
    private readonly especiesService: EspeciesService,
  ) {
    super(razaRepository, 'Raza');
  }

  override async findAll(): Promise<Raza[]> {
    return await this.razaRepository.find({ withDeleted: true });
  }

  // Sobrescribimos el método create para añadir nuestra validación de negocio
  async createRaza(createRazaDto: CreateRazaDto) {
    // 1. Validamos que la especie exista (Si no existe, el findOne lanzará un NotFoundException)
  
    await this.especiesService.findOne(createRazaDto.id_especie_fk);

    // 2. Si existe, llamamos al método create del padre (BaseCrudService)
    // No ponemos validación de nombre único global porque puede haber un "Bulldog" (Perro) y no queremos bloquearlo si luego intentan algo raro, aunque lo normal es que no se repitan. 
    return super.create(createRazaDto);
  }
}