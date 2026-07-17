import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Hospitalizacion } from './hospitalizacione.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('hospitalizacion_tratamiento_monitoreo')
export class HospitalizacionTratamientoMonitoreo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_hospitalizacion_fk', type: 'uuid' })
  id_hospitalizacion_fk: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  medicamento: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dosis: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  via: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  ml: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  hora: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fluido: string | null;

  @Column({ name: 'fluido_dosis', type: 'varchar', length: 100, nullable: true })
  fluidoDosis: string | null;

  @Column({ name: 'ml_hr', type: 'numeric', precision: 10, scale: 2, nullable: true })
  mlHr: number | null;

  @Column({ name: 'tiempo_inicio_fin', type: 'varchar', length: 100, nullable: true })
  tiempoInicioFin: string | null;

  @Column({ type: 'date', nullable: true })
  fecha: Date | string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  // Relaciones
  @ManyToOne(() => Hospitalizacion, (h) => h.tratamientos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_hospitalizacion_fk' })
  hospitalizacion: Hospitalizacion;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;
}
