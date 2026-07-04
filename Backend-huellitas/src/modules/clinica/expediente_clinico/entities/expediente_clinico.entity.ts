import { Entity, Column, ManyToOne, JoinColumn,OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Mascota } from '../../../identidad/mascotas/entities/mascota.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { HistorialClinico } from '../../historial_clinico/entities/historial_clinico.entity';

@Entity('expediente_clinico')
export class ExpedienteClinico extends BaseEntity {
  @Column({ name: 'id_mascota_fk', type: 'uuid', unique: true })
  id_mascota_fk: string;

  @Column({ name: 'fecha_apertura', type: 'date', default: () => 'CURRENT_DATE' })
  fecha_apertura: Date;

  @Column({ name: 'notas_generales', type: 'text', nullable: true })
  notas_generales: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => Mascota)
  @JoinColumn({ name: 'id_mascota_fk' })
  mascota: Mascota;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;

  @OneToMany(() => HistorialClinico, (historial) => historial.expediente)
  historiales: HistorialClinico[];  
}
