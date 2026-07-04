import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './entities/servicio.entity'; // Asegúrate de que la ruta sea correcta
import { CreateServicioDto } from './dto/create-servicio.dto';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';

@Injectable()
export class ServiciosService extends BaseCrudService<Servicio> {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {
    super(servicioRepository, 'Servicio');
  }

  // Usamos el create genérico y le decimos que valide que no haya servicios con el mismo nombre
  async createServicio(createServicioDto: CreateServicioDto) {
    return super.create(createServicioDto, { key: 'nombre' as keyof Servicio, value: createServicioDto.nombre });
  }
}