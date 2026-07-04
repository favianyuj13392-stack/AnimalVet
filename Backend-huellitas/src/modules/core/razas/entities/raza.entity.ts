import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Especie } from '../../especies/entities/especie.entity'; // 👈 Importamos la tabla con la que se conecta

@Entity('razas')
export class Raza  {
    @PrimaryGeneratedColumn('increment')
    id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'int' })
  id_especie_fk: number;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
  // 🔗 LLAVE FORÁNEA: id_especie_fk
  @ManyToOne(() => Especie, { eager: true })
  @JoinColumn({ name: 'id_especie_fk' })
  especie: Especie;
}