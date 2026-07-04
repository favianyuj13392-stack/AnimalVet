import { Entity, Column, DeleteDateColumn, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
  imagen_url: string | null;

  // numeric(10,2) en PostgreSQL
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  precio: number;

  @Column({ name: 'duracion_minutos', type: 'integer' })
  duracion_minutos: number;

  @Column({ name: 'requiere_veterinario', type: 'boolean', default: true })
  requiereVeterinario: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}