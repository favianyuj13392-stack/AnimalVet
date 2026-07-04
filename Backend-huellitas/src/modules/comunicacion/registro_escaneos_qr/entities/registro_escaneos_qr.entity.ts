import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseImmutableEntity } from '../../../../infraestructura/database/base-immutable.entity';
import { Mascota } from '../../../identidad/mascotas/entities/mascota.entity';

@Entity('registro_escaneos_qr')
export class RegistroEscaneoQR extends BaseImmutableEntity {
  @Column({ name: 'id_mascota_fk', type: 'uuid' })
  id_mascota_fk: string;

  @Column({ name: 'latitud', type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitud: number;

  @Column({ name: 'longitud', type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitud: number;

  @Column({ name: 'user_agent', type: 'varchar', length: 300, nullable: true })
  user_agent: string;

  @Column({ name: 'notificacion_enviada', type: 'boolean', default: false })
  notificacion_enviada: boolean;

  // 🔗 LLAVES FORÁNEAS (Sin updated_by ni deleted_at)
  @ManyToOne(() => Mascota)
  @JoinColumn({ name: 'id_mascota_fk' })
  mascota: Mascota;
}
