import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { CategoriaProducto } from '../../../core/categorias_producto/entities/categoria_producto.entity';

@Entity('productos')
export class Producto extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'imagen_url', type: 'varchar', length: 500, nullable: true })
  imagen_url: string | null;

  @Column({ name: 'unidad_medida', type: 'varchar', length: 30, nullable: true })
  unidadMedida: string;

  @Column({ name: 'requiere_receta', type: 'boolean', default: false })
  requiereReceta: boolean;

  @Column({ name: 'precio_venta', type: 'numeric', precision: 10, scale: 2 })
  precioVenta: number;

  @Column({ name: 'stock_actual', type: 'integer', default: 0 })
  stockActual: number;

  @Column({ name: 'stock_minimo', type: 'integer', default: 5 })
  stockMinimo: number;

  @Column({ name: 'tipo_producto', type: 'varchar', length: 20, default: 'Unitario' })
  tipoProducto: 'Unitario' | 'Multidosis';

  @Column({ name: 'unidad_dosis', type: 'varchar', length: 30, nullable: true })
  unidadDosis: string | null;

  @Column({ name: 'contenido_dosis_por_envase', type: 'numeric', precision: 10, scale: 2, nullable: true })
  contenidoDosisPorEnvase: number | null;

  @Column({ name: 'dias_caducidad_abierto', type: 'integer', nullable: true })
  diasCaducidadAbierto: number | null;

  @Column({ name: 'precio_por_dosis', type: 'numeric', precision: 10, scale: 2, nullable: true })
  precioPorDosis: number | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // 🔗 LLAVE FORÁNEA: id_categoria_fk
  @ManyToOne(() => CategoriaProducto)
  @JoinColumn({ name: 'id_categoria_fk' })
  categoria: CategoriaProducto;
}