import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { HistorialClinico } from '../../historial_clinico/entities/historial_clinico.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { Receta } from '../../recetas/entities/receta.entity';

@Entity('seguimientos_clinicos')
export class SeguimientoClinico extends BaseEntity {
  @Column({ name: 'id_historial_clinico_fk', type: 'uuid' })
  idHistorialClinicoFk: string;

  @Column({ name: 'fecha', type: 'date', default: () => 'CURRENT_DATE' })
  fecha: Date;

  @Column({ name: 'hora', type: 'varchar', length: 10, default: () => "to_char(now(), 'HH24:MI')" })
  hora: string;

  @Column({ name: 'veterinario_id', type: 'uuid' })
  veterinarioId: string;

  @Column({ type: 'varchar', length: 20, default: 'FINALIZADO' })
  estado: string; // 'BORRADOR' | 'FINALIZADO'

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  sintomas: string | null;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'text', nullable: true })
  tratamiento: string | null;

  @Column({ name: 'diagnostico_actual', type: 'text', nullable: true })
  diagnosticoActual: string | null;

  @Column({ type: 'text', nullable: true })
  recomendaciones: string | null;

  // Constantes Vitales Opcionales
  @Column({ name: 'peso_kg', type: 'numeric', precision: 5, scale: 2, nullable: true })
  pesoKg: number | null;

  @Column({ name: 'temperatura_c', type: 'numeric', precision: 4, scale: 2, nullable: true })
  temperaturaC: number | null;

  @Column({ name: 'frecuencia_cardiaca', type: 'integer', nullable: true })
  frecuenciaCardiaca: number | null;

  @Column({ name: 'frecuencia_respiratoria', type: 'integer', nullable: true })
  frecuenciaRespiratoria: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mucosas: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  // Relaciones
  @ManyToOne(() => HistorialClinico, (hc) => hc.seguimientos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_historial_clinico_fk' })
  historialClinico: HistorialClinico;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'veterinario_id' })
  veterinario: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;

  @OneToMany(() => Receta, (receta) => receta.seguimiento)
  recetas: Receta[];
}
