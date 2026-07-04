import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { PlantillaProductoRecomendado } from './plantilla_producto_recomendado.entity';

@Entity('plantillas_patologia')
export class PlantillaPatologia extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ name: 'palabras_clave', type: 'varchar', length: 255 })
  palabrasClave: string; // e.g. "dermatitis,alergia,piel,comezon"

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @OneToMany(() => PlantillaProductoRecomendado, (rec) => rec.plantilla, { cascade: true })
  recomendaciones: PlantillaProductoRecomendado[];
}
