// src/modules/clinica/detalles_receta/entities/detalles_receta.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Receta } from '../../recetas/entities/receta.entity';
import { Producto } from '../../../inventario/productos/entities/producto.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('detalles_receta')
export class DetallesReceta extends BaseEntity {
  @Column({ name: 'id_receta_fk', type: 'uuid' })
  idRecetaFk: string;

  @Column({ name: 'id_producto_fk', type: 'uuid', nullable: true })
  idProductoFk: string | null;

  @Column({ name: 'medicamento_texto', type: 'varchar', length: 150, nullable: true })
  medicamentoTexto: string;

  @Column({ name: 'dosis', type: 'varchar', length: 100 })
  dosis: string;

  @Column({ name: 'frecuencia', type: 'varchar', length: 100 })
  frecuencia: string;

  @Column({ name: 'duracion_dias', type: 'int', nullable: true })
  duracionDias: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // Relaciones
  @ManyToOne(() => Receta, (receta) => receta.detalles)
  @JoinColumn({ name: 'id_receta_fk' })
  receta: Receta;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto_fk' })
  producto: Producto;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}