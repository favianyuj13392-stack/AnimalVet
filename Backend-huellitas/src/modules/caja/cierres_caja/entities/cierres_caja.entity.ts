import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseImmutableAuditEntity } from '../../../../infraestructura/database/base-immutable-audit.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('cierres_caja')
export class CierreCaja extends BaseImmutableAuditEntity {
  @Column({ name: 'id_cajero_fk', type: 'uuid' })
  id_cajero_fk: string;

  @Column({ name: 'fecha_turno', type: 'date' })
  fecha_turno: Date;

  @Column({ name: 'turno', type: 'varchar', length: 10, default: 'Completo' })
  turno: string; // 'Mañana', 'Tarde', 'Noche', 'Completo'

  @Column({ name: 'total_transacciones', type: 'integer', default: 0 })
  total_transacciones: number;

  @Column({ name: 'total_efectivo', type: 'numeric', precision: 10, scale: 2, default: 0 })
  total_efectivo: number;

  @Column({ name: 'total_qr', type: 'numeric', precision: 10, scale: 2, default: 0 })
  total_qr: number;

  @Column({ name: 'total_tarjeta', type: 'numeric', precision: 10, scale: 2, default: 0 })
  total_tarjeta: number;

  @Column({ name: 'total_descuentos', type: 'numeric', precision: 10, scale: 2, default: 0 })
  total_descuentos: number;

  @Column({ name: 'total_general', type: 'numeric', precision: 10, scale: 2, default: 0 })
  total_general: number;

  @Column({ name: 'cerrado_en', type: 'timestamp', default: () => 'now()' })
  cerrado_en: Date;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  // 🔗 LLAVES FORÁNEAS (Sin updated_by ni deletedAt - es INMUTABLE)
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_cajero_fk' })
  cajero: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;
}
