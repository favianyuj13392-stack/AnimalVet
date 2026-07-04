import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantillaPatologia } from './entities/plantilla_patologia.entity';
import { PlantillaProductoRecomendado } from './entities/plantilla_producto_recomendado.entity';

@Injectable()
export class PlantillasPatologiaService {
  constructor(
    @InjectRepository(PlantillaPatologia)
    private readonly plantillaRepo: Repository<PlantillaPatologia>,
    @InjectRepository(PlantillaProductoRecomendado)
    private readonly recomendacionRepo: Repository<PlantillaProductoRecomendado>,
  ) {}

  async findAll(): Promise<PlantillaPatologia[]> {
    return this.plantillaRepo.find({
      relations: ['recomendaciones', 'recomendaciones.producto'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<PlantillaPatologia> {
    const plantilla = await this.plantillaRepo.findOne({
      where: { id },
      relations: ['recomendaciones', 'recomendaciones.producto'],
    });
    if (!plantilla) {
      throw new NotFoundException(`Plantilla con ID ${id} no encontrada.`);
    }
    return plantilla;
  }
}
