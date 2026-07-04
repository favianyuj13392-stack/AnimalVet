import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Hospitalizacion } from './hospitalizacione.entity';
import { Producto } from '../../../inventario/productos/entities/producto.entity';
import { Servicio } from '../../../core/servicios/entities/servicio.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('hospitalizacion_insumos')
export class HospitalizacionInsumo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_hospitalizacion_fk', type: 'uuid' })
  id_hospitalizacion_fk: string;

  @Column({ name: 'id_producto_fk', type: 'uuid', nullable: true })
  id_producto_fk: string | null;

  @Column({ name: 'id_servicio_fk', type: 'int', nullable: true })
  id_servicio_fk: number | null;

  @Column({ type: 'integer' })
  cantidad: number;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  // 🔗 RELACIONES
  @ManyToOne(() => Hospitalizacion, (h) => h.insumos)
  @JoinColumn({ name: 'id_hospitalizacion_fk' })
  hospitalizacion: Hospitalizacion;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'id_producto_fk' })
  producto: Producto;

  @ManyToOne(() => Servicio)
  @JoinColumn({ name: 'id_servicio_fk' })
  servicio: Servicio;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;
}