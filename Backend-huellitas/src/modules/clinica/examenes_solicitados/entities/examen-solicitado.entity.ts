import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { HistorialClinico } from '../../historial_clinico/entities/historial_clinico.entity';
import { InformeClinico } from '../../informes_clinicos/entities/informe-clinico.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

export enum EstadoExamenSolicitado {
  SOLICITADO = 'SOLICITADO',
  REALIZADO = 'REALIZADO',
  CANCELADO = 'CANCELADO',
}

@Entity('examenes_solicitados')
export class ExamenSolicitado extends BaseEntity {
  @Column({ name: 'id_historial_fk', type: 'uuid' })
  idHistorialFk: string;

  @Column({ type: 'varchar', length: 50 })
  tipo: string; // 'ECOGRAFIA' | 'RADIOGRAFIA' | 'LABORATORIO' | 'CITOLOGIA' | 'HISTOPATOLOGIA' | 'ELECTROCARDIOGRAMA' | 'OTRO'

  @Column({
    type: 'enum',
    enum: EstadoExamenSolicitado,
    default: EstadoExamenSolicitado.SOLICITADO,
  })
  estado: EstadoExamenSolicitado;

  @Column({ name: 'fecha_solicitud', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaSolicitud: Date;

  @Column({ name: 'fecha_realizacion', type: 'timestamp', nullable: true })
  fechaRealizacion: Date | null;

  @Column({ name: 'informe_id', type: 'uuid', nullable: true })
  informeId: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  // Relaciones
  @ManyToOne(() => HistorialClinico, (hc) => hc.examenesSolicitados, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_historial_fk' })
  historialClinico: HistorialClinico;

  @ManyToOne(() => InformeClinico, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'informe_id' })
  informe: InformeClinico;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}
