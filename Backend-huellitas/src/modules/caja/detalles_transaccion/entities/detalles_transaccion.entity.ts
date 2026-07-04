import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { TransaccionCaja } from '../../transacciones_caja/entities/transacciones_caja.entity';
import { Producto } from '../../../inventario/productos/entities/producto.entity';
import { Servicio } from '../../../core/servicios/entities/servicio.entity';
import { Receta } from '../../../clinica/recetas/entities/receta.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { LoteCaducidad } from '../../../inventario/lotes_caducidad/entities/lotes_caducidad.entity';

@Entity('detalles_transaccion')
export class DetalleTransaccion extends BaseEntity {
  @Column({ name: 'id_transaccion_fk', type: 'uuid' })
  id_transaccion_fk: string;

  @Column({ name: 'id_producto_fk', type: 'uuid', nullable: true })
  id_producto_fk: string | null;

  @Column({ name: 'id_servicio_fk', type: 'integer', nullable: true })
  id_servicio_fk: number | null;

  @Column({ name: 'id_receta_fk', type: 'uuid', nullable: true })
  id_receta_fk: string | null;

  @Column({ name: 'id_lote_fk', type: 'uuid', nullable: true })
  id_lote_fk: string | null;

  @Column({ type: 'integer' })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'numeric', precision: 10, scale: 2 })
  precioUnitario: number;

  @Column({ name: 'subtotal_linea', type: 'numeric', precision: 10, scale: 2 })
  subtotalLinea: number;
  
  @Column({ name: 'tipo_cobro', type: 'varchar', length: 20 })
  tipo_cobro: string; 

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => TransaccionCaja)
  @JoinColumn({ name: 'id_transaccion_fk' })
  transaccion: TransaccionCaja;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto_fk' })
  producto: Producto;

  @ManyToOne(() => Servicio)
  @JoinColumn({ name: 'id_servicio_fk' })
  servicio: Servicio;

  @ManyToOne(() => Receta)
  @JoinColumn({ name: 'id_receta_fk' })
  receta: Receta;

  @ManyToOne(() => LoteCaducidad, { nullable: true })
  @JoinColumn({ name: 'id_lote_fk' })
  lote: LoteCaducidad;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}
