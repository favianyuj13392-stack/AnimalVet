import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Raza } from '../../../core/razas/entities/raza.entity';

@Entity('mascotas')
export class Mascota extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fecha_nacimiento: Date;

  @Column({ type: 'char', length: 1 })
  sexo: string;

  @Column({ type: 'boolean', default: false })
  esterilizado: boolean;

  @Column({ name: 'hash_qr_identidad', type: 'varchar', length: 255, unique: true })
  hash_qr_identidad: string;

  @Column({ type: 'uuid', nullable: true })
  id_dueno_fk: string;

  @Column({ type: 'int', nullable: true })
  id_raza_fk: number;

  @Column({ name: 'estado_perdido', type: 'boolean', default: false })
  estado_perdido: boolean;

  @Column({ name: 'url_perfil_publico', type: 'varchar', length: 500, nullable: true })
  url_perfil_publico: string;

  @Column({ name: 'foto_url', type: 'varchar', length: 500, nullable: true })
  foto_url: string | null;

  @Column({ name: 'caracteristicas_fisicas', type: 'text', nullable: true })
  caracteristicas_fisicas: string | null;

  @Column({ name: 'contacto_emergencia_telefono', type: 'varchar', length: 20, nullable: true })
  contacto_emergencia_telefono: string | null;

  @Column({ name: 'punto_entrega_nombre', type: 'varchar', length: 200, nullable: true })
  punto_entrega_nombre: string | null;

  @Column({ name: 'punto_entrega_direccion', type: 'varchar', length: 300, nullable: true })
  punto_entrega_direccion: string | null;

  @Column({ name: 'punto_entrega_referencia', type: 'varchar', length: 300, nullable: true })
  punto_entrega_referencia: string | null;

  @Column({ name: 'punto_entrega_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  punto_entrega_lat: number | null;

  @Column({ name: 'punto_entrega_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  punto_entrega_lng: number | null;

  @Column({ name: 'recompensa', type: 'boolean', default: false })
  recompensa: boolean;

  @Column({ name: 'mensaje_encontrador', type: 'varchar', length: 500, nullable: true })
  mensaje_encontrador: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // 🔗 LLAVE FORÁNEA: id_dueno_fk
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_dueno_fk' })
  dueno: Usuario;

  // 🔗 LLAVE FORÁNEA: id_raza_fk
  @ManyToOne(() => Raza)
  @JoinColumn({ name: 'id_raza_fk' })
  raza: Raza;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}