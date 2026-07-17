import { Entity, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { ExpedienteClinico } from '../../expediente_clinico/entities/expediente_clinico.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { Cita } from '../../citas/entities/cita.entity';
import { Receta } from '../../recetas/entities/receta.entity';
import { VacunaAplicada } from '../../vacunas_aplicadas/entities/vacunas_aplicada.entity';
// 👇 NUEVAS IMPORTACIONES
import { Hospitalizacion } from '../../hospitalizaciones/entities/hospitalizacione.entity';
import { ArchivoAdjunto } from '../../archivos_adjuntos/entities/archivos_adjunto.entity';
import { HistorialPatologia } from './historial-patologia.entity';
import { SeguimientoClinico } from '../../seguimientos_clinicos/entities/seguimiento-clinico.entity';
import { InformeClinico } from '../../informes_clinicos/entities/informe-clinico.entity';
import { ExamenSolicitado } from '../../examenes_solicitados/entities/examen-solicitado.entity';

@Entity('historial_clinico')
export class HistorialClinico extends BaseEntity {
  @Column({ name: 'id_expediente_fk', type: 'uuid' })
  id_expediente_fk: string;

  @Column({ name: 'id_veterinario_fk', type: 'uuid' })
  id_veterinario_fk: string;

  @Column({ name: 'id_cita_fk', type: 'uuid', nullable: true, unique: true })
  id_cita_fk: string;

  @Column({ name: 'fecha_consulta', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_consulta: Date;

  @Column({ name: 'tipo_atencion', type: 'varchar', length: 20, default: 'Consulta' })
  tipo_atencion: string;

  @Column({ name: 'motivo_consulta', type: 'varchar', length: 255 })
  motivo_consulta: string;

  @Column({ type: 'text', nullable: true })
  sintomas: string | null; 

  @Column({ name: 'peso_kg', type: 'numeric', precision: 5, scale: 2 })
  peso_kg: number;

  @Column({ name: 'temperatura_c', type: 'numeric', precision: 4, scale: 2 })
  temperatura_c: number;

  @Column({ name: 'frecuencia_cardiaca', type: 'integer' })
  frecuencia_cardiaca: number;

  @Column({ name: 'frecuencia_respiratoria', type: 'integer' })
  frecuencia_respiratoria: number;

  @Column({ name: 'triaje_completado', type: 'boolean', default: false })
  triaje_completado: boolean;

  @Column({ name: 'turno', type: 'varchar', length: 20, nullable: true })
  turno: string | null;

  @Column({ name: 'mucosas', type: 'varchar', length: 100, nullable: true })
  mucosas: string | null;

  @Column({ name: 'anamnesis', type: 'text', nullable: true })
  anamnesis: string | null;

  @Column({ name: 'diagnostico_presuntivo', type: 'text', nullable: true })
  diagnostico_presuntivo: string | null;

  @Column({ name: 'diagnostico_definitivo', type: 'text', nullable: true })
  diagnostico_definitivo: string | null;

  // Exámenes Complementarios Checkboxes
  @Column({ name: 'exam_ecografia', type: 'boolean', default: false })
  exam_ecografia: boolean;

  @Column({ name: 'exam_rayos_x', type: 'boolean', default: false })
  exam_rayos_x: boolean;

  @Column({ name: 'exam_hemograma', type: 'boolean', default: false })
  exam_hemograma: boolean;

  @Column({ name: 'exam_quimica_sanguinea', type: 'boolean', default: false })
  exam_quimica_sanguinea: boolean;

  @Column({ name: 'exam_otros', type: 'boolean', default: false })
  exam_otros: boolean;

  @Column({ name: 'exam_resultados', type: 'text', nullable: true })
  exam_resultados: string | null;

  @Column({ type: 'text' })
  diagnostico: string;

  @Column({ name: 'notas_internas', type: 'text', nullable: true })
  notas_internas: string | null;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'ABIERTA' })
  estado: string; // 'ABIERTA' | 'FINALIZADA' | 'CANCELADA'

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

  @OneToMany(() => SeguimientoClinico, (s) => s.historialClinico)
  seguimientos: SeguimientoClinico[];

  @OneToMany(() => InformeClinico, (i) => i.historialClinico)
  informes: InformeClinico[];

  @OneToMany(() => ExamenSolicitado, (e) => e.historialClinico)
  examenesSolicitados: ExamenSolicitado[];

  @OneToMany(() => HistorialPatologia, (p) => p.historialClinico, { cascade: true })
  patologias: HistorialPatologia[];

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => ExpedienteClinico, (expediente) => expediente.historiales)
  @JoinColumn({ name: 'id_expediente_fk' })
  expediente: ExpedienteClinico;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_veterinario_fk' })
  veterinario: Usuario;

  @ManyToOne(() => Cita)
  @JoinColumn({ name: 'id_cita_fk' })
  cita: Cita;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;

  @OneToMany(() => Receta, (receta) => receta.historial)
  recetas: Receta[];

  @OneToMany(() => VacunaAplicada, (vacunaAplicada) => vacunaAplicada.historial)
  vacunasAplicadas: VacunaAplicada[];

  // 👇 RELACIONES INVERSAS AÑADIDAS PARA EL EXPEDIENTE
  @OneToOne(() => Hospitalizacion, (hospitalizacion) => hospitalizacion.historial)
  hospitalizacion: Hospitalizacion;

  @OneToMany(() => ArchivoAdjunto, (archivo) => archivo.historialClinico)
  archivosAdjuntos: ArchivoAdjunto[];
}