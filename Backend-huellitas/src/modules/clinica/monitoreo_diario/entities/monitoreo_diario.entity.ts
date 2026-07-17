import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Hospitalizacion } from '../../hospitalizaciones/entities/hospitalizacione.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('monitoreo_diario')
export class MonitoreoDiario extends BaseEntity {
  @Column({ name: 'id_hospitaliza_fk', type: 'uuid' })
  id_hospitaliza_fk: string;

  @Column({ name: 'id_veterinario_fk', type: 'uuid' })
  id_veterinario_fk: string;

  @Column({ name: 'turno', type: 'varchar', length: 10, default: 'Mañana' })
  turno: string;

  @Column({ name: 'temperatura_c', type: 'numeric', precision: 4, scale: 2, nullable: true })
  temperaturaC: number | null;

  @Column({ name: 'freq_cardiaca', type: 'integer', nullable: true })
  freqCardiaca: number | null;

  @Column({ name: 'freq_respiratoria', type: 'integer', nullable: true })
  freqRespiratoria: number | null;

  @Column({ name: 'vomito_diarrea_convulsion', type: 'varchar', length: 100, nullable: true })
  vomitoDiarreaConvulsion: string | null;

  @Column({ name: 'presion', type: 'varchar', length: 50, nullable: true })
  presion: string | null;

  @Column({ name: 'spo2', type: 'integer', nullable: true })
  spo2: number | null;

  @Column({ name: 'tllc', type: 'varchar', length: 50, nullable: true })
  tllc: string | null;

  @Column({ name: 'mucosa', type: 'varchar', length: 100, nullable: true })
  mucosa: string | null;

  @Column({ name: 'peso_kg', type: 'numeric', precision: 5, scale: 2, nullable: true })
  pesoKg: number | null;

  @Column({ name: 'produccion_orina_ml', type: 'integer', nullable: true })
  produccionOrinaMl: number | null;

  @Column({ name: 'glasgow', type: 'integer', nullable: true })
  glasgow: number | null;

  @Column({ type: 'text' })
  observaciones: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => Hospitalizacion)
  @JoinColumn({ name: 'id_hospitaliza_fk' })
  hospitalizacion: Hospitalizacion;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_veterinario_fk' })
  veterinario: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}