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
    id_especie_fk: vacuna.id_especie_fk,
    id_producto_fk: vacuna.id_producto_fk ?? undefined,
    createdAt: vacuna.createdAt,
    updatedAt: vacuna.updatedAt,
    deletedAt: vacuna.deletedAt ?? undefined,
    
    // Map the linked product if present
    producto: vacuna.producto ? {
      id: vacuna.producto.id,
      nombre: vacuna.producto.nombre,
      precio_venta: Number(vacuna.producto.precioVenta),
      stock_actual: Number(vacuna.producto.stockActual),
    } : undefined,

    especie: vacuna.especie ? {
      id: vacuna.especie.id,
      nombre: vacuna.especie.nombre,
    } : undefined,
  };
}

  // Internal helper — returns raw TypeORM entity with metadata intact (for save/softRemove)
  private async findEntity(id: number | string): Promise<CatalogoVacuna> {
    const entity = await this.vacunaRepository.findOne({
      where: { id: Number(id) },
      relations: ['producto', 'especie'],
      withDeleted: true,
    });
    if (!entity) throw new Error(`Vacuna con ID ${id} no encontrada`);
    return entity;
  }

  // 👇 2. Sobrescribimos findAll para incluir la relación con producto y listar inactivas
  override async findAll(): Promise<any> {
    const vacunas = await this.vacunaRepository.find({
      relations: ['producto', 'especie'],
      withDeleted: true, // Include soft-deleted vaccines so admin can restore them
    });
    return vacunas.map(vacuna => this.mapToResponse(vacuna));
  }

  // 👇 3. findOne returns a DTO (for controller/external use)
  override async findOne(id: number | string): Promise<any> {
    const vacuna = await this.findEntity(id);
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

  // Sobrescribimos el método update para mapear correctamente los campos
  override async update(id: number | string, updateDto: UpdateCatalogoVacunaDto): Promise<CatalogoVacuna> {
    // Use findEntity (raw TypeORM entity) so .save() works correctly with metadata
    const entity = await this.findEntity(id);

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
      entity.id_producto_fk = updateDto.id_producto_fk ?? null;
      // Clear the loaded relation so TypeORM picks up the new FK on next load
      entity.producto = null as any;
    }

    return await this.vacunaRepository.save(entity);
  }

  // Sobrescribimos remove para que use la entidad pura de TypeORM
  override async remove(id: number | string): Promise<{ mensaje: string }> {
    const entity = await this.findEntity(id);
    await this.vacunaRepository.softRemove(entity);
    return { mensaje: `Vacuna con ID ${id} desactivada correctamente` };
  }

  // Restore a soft-deleted vaccine
  async activate(id: number | string): Promise<{ mensaje: string }> {
    await this.vacunaRepository.restore(Number(id));
    return { mensaje: `Vacuna con ID ${id} reactivada correctamente` };
  }
}