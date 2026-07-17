import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Hospitalizacion } from './hospitalizacione.entity';

@Entity('hospitalizacion_articulos')
export class HospitalizacionArticulo extends BaseEntity {
  @Column({ name: 'id_hospitalizacion_fk', type: 'uuid' })
  id_hospitalizacion_fk: string;

  @Column({ type: 'varchar', length: 150 })
  descripcion: string;

  @Column({ type: 'integer', default: 1 })
  cantidad: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observacion: string | null;

  @ManyToOne(() => Hospitalizacion, (h) => h.articulosIngresoList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_hospitalizacion_fk' })
  hospitalizacion: Hospitalizacion;
}
