import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Mascota } from '../../../identidad/mascotas/entities/mascota.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { HistorialClinico } from '../../../clinica/historial_clinico/entities/historial_clinico.entity';

@Entity('cirugias_registro')
export class CirugiaRegistro extends BaseEntity {
  @Column({ name: 'id_mascota_fk', type: 'uuid' })
  id_mascota_fk: string;

  @Column({ name: 'fecha', type: 'date' })
  fecha: Date;

  @Column({ name: 'tipo_cirugia', type: 'varchar', length: 200 })
  tipoCirugia: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ name: 'id_veterinario_fk', type: 'uuid', nullable: true })
  id_veterinario_fk: string | null;

  @Column({ name: 'id_historial_fk', type: 'uuid', nullable: true })
  id_historial_fk: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  // Relations
  @ManyToOne(() => Mascota)
  @JoinColumn({ name: 'id_mascota_fk' })
  mascota: Mascota;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_veterinario_fk' })
  veterinario: Usuario;

  @ManyToOne(() => HistorialClinico)
  @JoinColumn({ name: 'id_historial_fk' })
  historial: HistorialClinico;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;
}
