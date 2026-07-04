import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Repository, DeepPartial, FindOptionsWhere, ObjectLiteral } from 'typeorm';

// La 'T' es el genérico. Representará la entidad (Especie, Raza, Servicio...)
@Injectable()
export abstract class BaseCrudService<T extends ObjectLiteral> {
  constructor(
    // Recibimos el repositorio específico de la entidad
    protected readonly repository: Repository<T>,
    // Nombre de la entidad para los mensajes de error (ej: 'Especie')
    protected readonly entityName: string 
  ) {}

  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  async findOne(id: number | string): Promise<T> {
    // Buscamos por ID (asumiendo que la entidad tiene un campo 'id')
    const entity = await this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    });
    
    if (!entity) {
      throw new NotFoundException(`${this.entityName} con ID ${id} no encontrada`);
    }
    return entity;
  }

  // Método para crear con validación de duplicados opcional
  async create(createDto: DeepPartial<T>, uniqueField?: { key: keyof T; value: any }): Promise<T> {
    if (uniqueField) {
      const existe = await this.repository.findOne({
        where: { [uniqueField.key]: uniqueField.value } as unknown as FindOptionsWhere<T>,
      });
      if (existe) {
        throw new ConflictException(`Ya existe ${this.entityName} con ${String(uniqueField.key)}: '${uniqueField.value}'`);
      }
    }

    const nuevaEntidad = this.repository.create(createDto);
    return await this.repository.save(nuevaEntidad);
  }

  async update(id: number | string, updateDto: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return await this.repository.save(entity);
  }

  async remove(id: number | string): Promise<{ mensaje: string }> {
    const entity = await this.findOne(id);
    // Aplicamos Soft Delete (Regla RNF-06)
    await this.repository.softRemove(entity);
    return { mensaje: `${this.entityName} con ID ${id} desactivada correctamente` };
  }
}