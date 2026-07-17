import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('programa_sanitario_items')
export class ProgramaSanitarioItem {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 20 })
  especie: string; // 'Canino' | 'Felino'

  @Column({ name: 'edad_texto', type: 'varchar', length: 100 })
  edadTexto: string;

  @Column({ name: 'edad_dias_desde', type: 'integer', nullable: true })
  edadDiasDesde: number | null;

  @Column({ name: 'edad_dias_hasta', type: 'integer', nullable: true })
  edadDiasHasta: number | null;

  @Column({ type: 'text' })
  detalle: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'integer', default: 0 })
  orden: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}
