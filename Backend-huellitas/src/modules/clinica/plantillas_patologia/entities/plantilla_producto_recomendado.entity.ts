import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { PlantillaPatologia } from './plantilla_patologia.entity';
import { Producto } from '../../../inventario/productos/entities/producto.entity';

@Entity('plantillas_productos_recomendados')
export class PlantillaProductoRecomendado extends BaseEntity {
  @Column({ name: 'id_plantilla_fk', type: 'uuid' })
  idPlantillaFk: string;

  @Column({ name: 'id_producto_fk', type: 'uuid' })
  idProductoFk: string;

  @Column({ name: 'dosis_sugerida', type: 'varchar', length: 100, nullable: true })
  dosisSugerida: string; // e.g. "1 tableta" or "1 gota/kg"

  @Column({ name: 'formula_dosis', type: 'varchar', length: 100, nullable: true })
  formulaDosis: string; // e.g. "1 * peso" or "2 * peso" or null

  @Column({ name: 'frecuencia_sugerida', type: 'varchar', length: 30, nullable: true })
  frecuenciaSugerida: string; // e.g. "c/12h"

  @Column({ name: 'duracion_dias_sugerida', type: 'integer', nullable: true })
  duracionDiasSugerida: number; // e.g. 5

  @ManyToOne(() => PlantillaPatologia, (plantilla) => plantilla.recomendaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_plantilla_fk' })
  plantilla: PlantillaPatologia;

  @ManyToOne(() => Producto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_producto_fk' })
  producto: Producto;
}
