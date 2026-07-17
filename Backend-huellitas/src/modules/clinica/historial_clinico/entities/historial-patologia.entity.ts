import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { HistorialClinico } from './historial_clinico.entity';
import { Patologia } from '../../../core/patologias/entities/patologia.entity';

@Entity('historial_patologias')
export class HistorialPatologia extends BaseEntity {
  @Column({ name: 'id_historial_fk', type: 'uuid' })
  id_historial_fk: string;

  @Column({ name: 'id_patologia_fk', type: 'uuid' })
  id_patologia_fk: string;

  @Column({ type: 'varchar', length: 20 }) // 'PRESUNTIVO' | 'DEFINITIVO'
  tipo: string;

  @ManyToOne(() => HistorialClinico, (hc) => hc.patologias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_historial_fk' })
  historialClinico: HistorialClinico;

  @ManyToOne(() => Patologia)
  @JoinColumn({ name: 'id_patologia_fk' })
  patologia: Patologia;
}
