import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Producto } from './producto.entity';
import { LoteCaducidad } from '../../lotes_caducidad/entities/lotes_caducidad.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('envases_abiertos')
export class EnvaseAbierto extends BaseEntity {
  @Column({ name: 'id_producto_fk', type: 'uuid' })
  idProductoFk: string;

  @Column({ name: 'id_lote_fk', type: 'uuid' })
  idLoteFk: string;

  @Column({ name: 'volumen_restante', type: 'numeric', precision: 10, scale: 2 })
  volumenRestante: number;

  @Column({ name: 'fecha_apertura', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaApertura: Date;

  @Column({ name: 'fecha_caducidad_abierto', type: 'timestamp' })
  fechaCaducidadAbierto: Date;

  @Column({ type: 'varchar', length: 20, default: 'Abierto' })
  estado: 'Abierto' | 'Agotado' | 'Desechado';

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // 🔗 RELACIONES
  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto_fk' })
  producto: Producto;

  @ManyToOne(() => LoteCaducidad)
  @JoinColumn({ name: 'id_lote_fk' })
  lote: LoteCaducidad;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}
