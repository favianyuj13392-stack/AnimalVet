import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { HistorialClinico } from '../../historial_clinico/entities/historial_clinico.entity';
import { Mascota } from '../../../identidad/mascotas/entities/mascota.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { VacunaAplicada } from '../../vacunas_aplicadas/entities/vacunas_aplicada.entity'; // 👈 IMPORT
import { HospitalizacionInsumo } from './hospitalizacion-insumo.entity'; // 👈 IMPORT (Lo crearemos abajo)
import { ArchivoAdjunto } from '../../archivos_adjuntos/entities/archivos_adjunto.entity'; // 👈 IMPORTAR
@Entity('hospitalizaciones')
export class Hospitalizacion extends BaseEntity {
  @Column({ name: 'id_historial_fk', type: 'uuid' })
  id_historial_fk: string;

  @Column({ name: 'id_mascota_fk', type: 'uuid' })
  id_mascota_fk: string;

  @Column({ name: 'id_veterinario_responsable', type: 'uuid' })
  id_veterinario_responsable: string;

  @Column({ name: 'fecha_ingreso', type: 'timestamp' })
  fechaIngreso: Date;

  @Column({ name: 'fecha_alta', type: 'timestamp', nullable: true })
  fechaAlta: Date | null;

  @Column({ name: 'motivo_ingreso', type: 'text' })
  motivoIngreso: string;

  @Column({ name: 'estado_actual', type: 'varchar', length: 50, default: 'Observacion' })
  estadoActual: string;

  @Column({ name: 'costo_por_dia', type: 'numeric', precision: 10, scale: 2, default: 0.00 })
  costoPorDia: number;

  @Column({ name: 'condicion_egreso', type: 'varchar', length: 50, nullable: true })
  condicionEgreso: string | null;

  @Column({ name: 'diagnostico_egreso', type: 'text', nullable: true })
  diagnosticoEgreso: string | null;

  @Column({ name: 'instrucciones_alta', type: 'text', nullable: true })
  instruccionesAlta: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  // 🔗 LLAVES FORÁNEAS (ManyToOne)
  @ManyToOne(() => HistorialClinico)
  @JoinColumn({ name: 'id_historial_fk' })
  historial: HistorialClinico;

  @ManyToOne(() => Mascota)
  @JoinColumn({ name: 'id_mascota_fk' })
  mascota: Mascota;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_veterinario_responsable' })
  veterinario: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;

  // 👇 RELACIONES INVERSAS (OneToMany) - Para traer las listas en el Dashboard
  @OneToMany(() => VacunaAplicada, (vacuna) => vacuna.hospitalizacion)
  vacunasAplicadas: VacunaAplicada[];

  @OneToMany(() => HospitalizacionInsumo, (insumo) => insumo.hospitalizacion)
  insumos: HospitalizacionInsumo[];

  @OneToMany(() => ArchivoAdjunto, (archivo) => archivo.hospitalizacion)
  archivos: ArchivoAdjunto[];
}