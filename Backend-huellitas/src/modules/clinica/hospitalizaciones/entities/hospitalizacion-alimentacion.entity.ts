import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Hospitalizacion } from './hospitalizacione.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('hospitalizacion_alimentacion')
export class HospitalizacionAlimentacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_hospitalizacion_fk', type: 'uuid' })
  id_hospitalizacion_fk: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dia: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  hora: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tipo: string | null; // e.g. VO, DI, CO

  @Column({ type: 'varchar', length: 100, nullable: true })
  cantidad: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  // Relaciones
  @ManyToOne(() => Hospitalizacion, (h) => h.alimentacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_hospitalizacion_fk' })
  hospitalizacion: Hospitalizacion;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;
}
