import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Producto } from '../../productos/entities/producto.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('lotes_caducidad')
export class LoteCaducidad extends BaseEntity {
  @Column({ name: 'numero_lote', type: 'varchar', length: 100 })
  numeroLote: string;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fechaVencimiento: Date;

  @Column({ name: 'cantidad_inicial', type: 'integer' })
  cantidadInicial: number;

  @Column({ name: 'cantidad_actual', type: 'integer' })
  cantidadActual: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ name: 'id_producto_fk', type: 'uuid' })
  idProductoFk: string;

  // 🔗 LLAVE FORÁNEA: id_producto_fk
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