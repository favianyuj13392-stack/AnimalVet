import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,PrimaryGeneratedColumn } from 'typeorm';
import { Especie } from '../../especies/entities/especie.entity';
import { Producto } from '../../../inventario/productos/entities/producto.entity';

@Entity('catalogo_vacunas')
export class CatalogoVacuna {
    @PrimaryGeneratedColumn('increment')
    id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'dias_para_refuerzo', type: 'integer' })
  diasParaRefuerzo: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

@Column({ name: 'id_producto_fk', type: 'uuid', nullable: true })
  id_producto_fk: string;

  @Column({ type: 'int' })
  id_especie_fk: number;

  // 🔗 LLAVE FORÁNEA: id_especie_fk
  @ManyToOne(() => Especie)
  @JoinColumn({ name: 'id_especie_fk' })
  especie: Especie;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto_fk' })
  producto: Producto;
}