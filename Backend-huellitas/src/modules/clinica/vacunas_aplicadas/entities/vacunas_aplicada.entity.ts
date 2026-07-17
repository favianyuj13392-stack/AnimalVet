import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { HistorialClinico } from '../../historial_clinico/entities/historial_clinico.entity';
import { Hospitalizacion } from '../../hospitalizaciones/entities/hospitalizacione.entity'; // 👈 NUEVO IMPORT
import { CatalogoVacuna } from '../../../core/catalogo_vacunas/entities/catalogo_vacuna.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { Mascota } from '../../../identidad/mascotas/entities/mascota.entity';

@Entity('vacunas_aplicadas')
export class VacunaAplicada extends BaseEntity {
  // 👇 NUEVA COLUMNA ZOOSANITARIO
  @Column({ name: 'id_mascota_fk', type: 'uuid', nullable: true })
  id_mascota_fk: string | null;

  // 👇 Cambiado a nullable: true
  @Column({ name: 'id_historial_fk', type: 'uuid', nullable: true })
  id_historial_fk: string | null;

  // 👇 NUEVA COLUMNA
  @Column({ name: 'id_hospitalizacion_fk', type: 'uuid', nullable: true })
  id_hospitalizacion_fk: string | null;

  @Column({ name: 'id_vacuna_fk', type: 'integer' })
  id_vacuna_fk: number;

  @Column({ name: 'id_veterinario_fk', type: 'uuid', nullable: true })
  id_veterinario_fk: string | null;

  @Column({ name: 'fecha_aplicacion', type: 'date' })
  fechaAplicacion: Date;

  @Column({ name: 'fecha_proxima_dosis', type: 'date', nullable: true })
  fechaProximaDosis: Date | null;

  @Column({ name: 'peso_mascota_kg', type: 'numeric', precision: 5, scale: 2, nullable: true })
  pesoMascotaKg: number | null;

  @Column({ name: 'lote_vacuna', type: 'varchar', length: 100, nullable: true })
  loteVacuna: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => Mascota)
  @JoinColumn({ name: 'id_mascota_fk' })
  mascota: Mascota;

  @ManyToOne(() => HistorialClinico)
  @JoinColumn({ name: 'id_historial_fk' })
  historial: HistorialClinico;

  // 👇 NUEVA RELACIÓN
  @ManyToOne(() => Hospitalizacion, (hospitalizacion) => hospitalizacion.vacunasAplicadas)
  @JoinColumn({ name: 'id_hospitalizacion_fk' })
  hospitalizacion: Hospitalizacion;

  @ManyToOne(() => CatalogoVacuna)
  @JoinColumn({ name: 'id_vacuna_fk' })
  vacuna: CatalogoVacuna;

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