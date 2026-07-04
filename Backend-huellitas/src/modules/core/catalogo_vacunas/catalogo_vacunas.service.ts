import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogoVacuna } from './entities/catalogo_vacuna.entity';
import { CreateCatalogoVacunaDto } from './dto/create-catalogo_vacuna.dto';
import { UpdateCatalogoVacunaDto } from './dto/update-catalogo_vacuna.dto';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';
import { EspeciesService } from '../especies/especies.service';
import { CatalogoVacunasResponseDto } from './dto/catalogo_vacunas-response.dto'; // 👈 Importa tu DTO
@Injectable()
export class CatalogoVacunasService extends BaseCrudService<CatalogoVacuna> {
  constructor(
    @InjectRepository(CatalogoVacuna)
    private readonly vacunaRepository: Repository<CatalogoVacuna>,
    private readonly especiesService: EspeciesService,
  ) {
    super(vacunaRepository, 'Catálogo de Vacuna');
  }


private mapToResponse(vacuna: CatalogoVacuna): CatalogoVacunasResponseDto {
  return {
    id: vacuna.id.toString(),
    nombre_vacuna: vacuna.nombre,
    descripcion: vacuna.descripcion,
    intervalo_revacunacion: `${vacuna.diasParaRefuerzo} días`,
    id_especie_fk: vacuna.id_especie_fk, // 👈 NUEVO: Fundamental para las búsquedas y mapeos del frontend
    createdAt: vacuna.createdAt,
    updatedAt: vacuna.updatedAt,
    
    // Mapeamos el producto si es que la vacuna lo tiene enlazado
    producto: vacuna.producto ? {
      id: vacuna.producto.id,
      nombre: vacuna.producto.nombre,
      precio_venta: Number(vacuna.producto.precioVenta),
      stock_actual: Number(vacuna.producto.stockActual),
    } : undefined,

    // 👇 NUEVO: Agregamos el mapeo de la especie que TypeORM cargó en la consulta
    especie: vacuna.especie ? {
      id: vacuna.especie.id,
      nombre: vacuna.especie.nombre,
    } : undefined,
  };
}

  // 👇 2. Sobrescribimos findAll para incluir la relación con producto
  override async findAll(): Promise<any> {
    const vacunas = await this.vacunaRepository.find({
      relations: ['producto', 'especie'], // Le decimos a TypeORM que traiga estas tablas
    });
    return vacunas.map(vacuna => this.mapToResponse(vacuna));
  }

  // 👇 3. Sobrescribimos findOne para incluir la relación
  override async findOne(id: number | string): Promise<any> {
    const vacuna = await this.vacunaRepository.findOne({
      where: { id: Number(id) },
      relations: ['producto', 'especie'],
    });

    if (!vacuna) {
      // Puedes usar la excepción de tu BaseCrudService aquí si quieres
      throw new Error(`Vacuna con ID ${id} no encontrada`);
    }

    return this.mapToResponse(vacuna);
  }

  async createVacuna(createDto: CreateCatalogoVacunaDto) {
    // 1. Validamos que la especie exista antes de guardar la vacuna
    await this.especiesService.findOne(createDto.id_especie_fk);

    // 2. Mapeamos de snake_case (DTO) a camelCase (Entidad)
    const entityData = this.vacunaRepository.create({
      nombre: createDto.nombre,
      descripcion: createDto.descripcion,
      diasParaRefuerzo: createDto.dias_para_refuerzo,
      id_especie_fk: createDto.id_especie_fk,
      id_producto_fk: createDto.id_producto_fk, // 👈 AÑADIDO
    });

    // 3. Guardamos
    return await this.vacunaRepository.save(entityData);
  }

  // Sobrescribimos el método update para mapear dias_para_refuerzo si viene
  override async update(id: number | string, updateDto: UpdateCatalogoVacunaDto): Promise<CatalogoVacuna> {
    const entity = await this.findOne(id);

    if (updateDto.nombre !== undefined) entity.nombre = updateDto.nombre;
    if (updateDto.descripcion !== undefined) entity.descripcion = updateDto.descripcion;
    if (updateDto.id_especie_fk !== undefined) {
      await this.especiesService.findOne(updateDto.id_especie_fk);
      entity.id_especie_fk = updateDto.id_especie_fk;
    }
    if (updateDto.dias_para_refuerzo !== undefined) {
      entity.diasParaRefuerzo = updateDto.dias_para_refuerzo;
    }
    if (updateDto.id_producto_fk !== undefined) {
      entity.id_producto_fk = updateDto.id_producto_fk;
    }

    return await this.vacunaRepository.save(entity);
  }
}