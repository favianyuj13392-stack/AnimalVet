import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Mascota } from '../../../identidad/mascotas/entities/mascota.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { Servicio } from '../../../core/servicios/entities/servicio.entity';

@Entity('citas')
export class Cita extends BaseEntity {
  @Column({ name: 'fecha_hora_inicio', type: 'timestamp' })
  fecha_hora_inicio: Date;

  @Column({ name: 'duracion_minutos', type: 'integer', default: 30 })
  duracion_minutos: number;

  @Column({ name: 'motivo_cita', type: 'varchar', length: 150 })
  motivo_cita: string;

  @Column({ name: 'tipo_prioridad', type: 'varchar', length: 15, default: 'Normal' })
  tipo_prioridad: string;

  @Column({ name: 'estado', type: 'varchar', length: 25 })
  estado: string; // 'Pendiente_Confirmacion', 'Confirmada', etc.

  @Column({ name: 'origen_reserva', type: 'varchar', length: 20 })
  origen_reserva: string; // 'WEB', 'BOT_WA', 'RECEPCION'

  @Column({ name: 'requiere_confirmacion', type: 'boolean', default: false })
  requiere_confirmacion: boolean;

  @Column({ name: 'motivo_cancelacion', type: 'varchar', length: 100, nullable: true })
  motivo_cancelacion: string | null;

  @Column({ name: 'id_mascota_fk', type: 'uuid', nullable: false })
  id_mascota_fk: string;

  @Column({ name: 'id_veterinario_fk', type: 'uuid', nullable: false })
  id_veterinario_fk: string;

  @Column({ name: 'id_servicio_fk', type: 'integer', nullable: false })
  id_servicio_fk: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;
  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => Mascota)
  @JoinColumn({ name: 'id_mascota_fk' })
  mascota: Mascota;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_veterinario_fk' })
  veterinario: Usuario;

  @ManyToOne(() => Servicio)
  @JoinColumn({ name: 'id_servicio_fk' })
  servicio: Servicio;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}