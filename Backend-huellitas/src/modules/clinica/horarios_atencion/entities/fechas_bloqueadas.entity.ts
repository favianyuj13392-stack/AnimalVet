import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('fechas_bloqueadas')
export class FechaBloqueada extends BaseEntity {
  @Column({ name: 'fecha', type: 'date', nullable: false })
  fecha: string; // Formato YYYY-MM-DD

  @Column({ name: 'motivo', type: 'varchar', length: 150, nullable: false })
  motivo: string; // 'Feriado', 'Vacaciones', 'Emergencia'

  @Column({ name: 'id_veterinario_fk', type: 'uuid', nullable: true })
  id_veterinario_fk: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_veterinario_fk' })
  veterinario?: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser?: Usuario;
}
