import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseImmutableEntity } from '../../../../infraestructura/database/base-immutable.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { Producto } from '../../productos/entities/producto.entity';
import { TransaccionCaja } from '../../../caja/transacciones_caja/entities/transacciones_caja.entity';
import { HistorialClinico } from '../../../clinica/historial_clinico/entities/historial_clinico.entity';
import { LoteCaducidad } from '../../lotes_caducidad/entities/lotes_caducidad.entity';

@Entity('kardex_inventario')
export class KardexInventario extends BaseImmutableEntity {
  @Column({ name: 'id_producto_fk', type: 'uuid' })
  idProductoFk: string;

  @Column({ name: 'id_usuario_fk', type: 'uuid' })
  idUsuarioFk: string;

  @Column({ name: 'tipo_movimiento', type: 'varchar', length: 20 })
  tipoMovimiento: string; // 'Entrada', 'Salida_Venta', etc.

  @Column({ type: 'integer' })
  cantidad: number;

  @Column({ name: 'saldo_resultante', type: 'integer' })
  saldoResultante: number;

  @Column({ name: 'motivo_detalle', type: 'varchar', length: 255, nullable: true })
  motivoDetalle: string;

  @Column({ name: 'id_lote_fk', type: 'uuid', nullable: true })
  idLoteFk: string | null;

  @Column({ name: 'id_transaccion_fk', type: 'uuid', nullable: true })
  idTransaccionFk: string | null;

  @Column({ name: 'id_historial_fk', type: 'uuid', nullable: true })
  idHistorialFk: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_fk' })
  usuario: Usuario;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto_fk' })
  producto: Producto;

  @ManyToOne(() => TransaccionCaja)
  @JoinColumn({ name: 'id_transaccion_fk' })
  transaccion: TransaccionCaja;

  @ManyToOne(() => LoteCaducidad, { nullable: true })
  @JoinColumn({ name: 'id_lote_fk' })
  lote: LoteCaducidad;

  @ManyToOne(() => HistorialClinico)
  @JoinColumn({ name: 'id_historial_fk' })
  historial: HistorialClinico;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;
}