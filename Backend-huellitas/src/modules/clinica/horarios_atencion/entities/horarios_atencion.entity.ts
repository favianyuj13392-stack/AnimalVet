import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('horarios_atencion')
export class HorarioAtencion extends BaseEntity {
  @Column({ name: 'id_veterinario_fk', type: 'uuid', nullable: false })
  id_veterinario_fk: string;

  @Column({ name: 'dia_semana', type: 'integer' })
  dia_semana: number;

  @Column({ name: 'hora_inicio', type: 'time' })
  hora_inicio: string;

  @Column({ name: 'hora_fin', type: 'time' })
  hora_fin: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // 🔗 LLAVE FORÁNEA: id_veterinario_fk
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