import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { HistorialClinico } from '../../../clinica/historial_clinico/entities/historial_clinico.entity';
import { Hospitalizacion } from '../../../clinica/hospitalizaciones/entities/hospitalizacione.entity';
import { DetalleTransaccion } from '../../detalles_transaccion/entities/detalles_transaccion.entity';

@Entity('transacciones_caja')
export class TransaccionCaja extends BaseEntity {
  @Column({ name: 'id_cajero_fk', type: 'uuid', nullable: false })
  id_cajero_fk: string;

  @Column({ name: 'id_cliente_fk', type: 'uuid', nullable: true })
  id_cliente_fk: string | null;

  @Column({ name: 'id_historial_fk', type: 'uuid', nullable: true })
  id_historial_fk: string | null;

  @Column({ name: 'id_hospitalizacion_fk', type: 'uuid', nullable: true })
  id_hospitalizacion_fk: string | null;

  @Column({ name: 'fecha_transaccion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaTransaccion: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ name: 'total_cobrado', type: 'numeric', precision: 10, scale: 2 })
  totalCobrado: number;

  @Column({ name: 'metodo_pago', type: 'varchar', length: 30 })
  metodoPago: string;

  @Column({ name: 'estado_transaccion', type: 'varchar', length: 20, default: 'Completada' })
  estadoTransaccion: string;

  @Column({ name: 'turno', type: 'varchar', length: 10, nullable: true })
  turno: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_cajero_fk' })
  cajero: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_cliente_fk' })
  cliente: Usuario;

  @ManyToOne(() => HistorialClinico)
  @JoinColumn({ name: 'id_historial_fk' })
  historial: HistorialClinico;

  @ManyToOne(() => Hospitalizacion)
  @JoinColumn({ name: 'id_hospitalizacion_fk' })
  hospitalizacion: Hospitalizacion;

  @OneToMany(() => DetalleTransaccion, (d) => d.transaccion)
  detalles: DetalleTransaccion[];

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}
