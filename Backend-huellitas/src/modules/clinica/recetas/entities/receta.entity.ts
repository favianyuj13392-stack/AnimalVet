// src/modules/clinica/recetas/entities/receta.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { HistorialClinico } from '../../historial_clinico/entities/historial_clinico.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { DetallesReceta } from '../../detalles_receta/entities/detalles_receta.entity';

@Entity('recetas')
export class Receta extends BaseEntity {
  @Column({ name: 'id_historial_fk', type: 'uuid' })
  idHistorialFk: string;

  @Column({ name: 'id_veterinario_fk', type: 'uuid' })
  idVeterinarioFk: string;

  @Column({ name: 'indicaciones_grales', type: 'text', nullable: true })
  indicacionesGrales: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  // Relaciones
  @ManyToOne(() => HistorialClinico)
  @JoinColumn({ name: 'id_historial_fk' })
  historial: HistorialClinico;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_veterinario_fk' })
  veterinario: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;

  @OneToMany(() => DetallesReceta, (detalle) => detalle.receta)
  detalles: DetallesReceta[];
}