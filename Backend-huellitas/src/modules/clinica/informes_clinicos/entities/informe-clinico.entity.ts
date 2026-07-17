import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { HistorialClinico } from '../../historial_clinico/entities/historial_clinico.entity';
import { SeguimientoClinico } from '../../seguimientos_clinicos/entities/seguimiento-clinico.entity';
import { Hospitalizacion } from '../../hospitalizaciones/entities/hospitalizacione.entity';
import { Mascota } from '../../../identidad/mascotas/entities/mascota.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

export enum TipoInformeClinico {
  ECOGRAFIA = 'ECOGRAFIA',
  RADIOGRAFIA = 'RADIOGRAFIA',
  LABORATORIO = 'LABORATORIO',
  CITOLOGIA = 'CITOLOGIA',
  HISTOPATOLOGIA = 'HISTOPATOLOGIA',
  ELECTROCARDIOGRAMA = 'ELECTROCARDIOGRAMA',
  OTRO = 'OTRO',
}

export enum EstadoInformeClinico {
  BORRADOR = 'BORRADOR',
  FINALIZADO = 'FINALIZADO',
  ENTREGADO = 'ENTREGADO',
}

@Entity('informes_clinicos')
export class InformeClinico extends BaseEntity {
  @Column({ name: 'id_mascota_fk', type: 'uuid' })
  idMascotaFk: string;

  @Column({ name: 'id_historial_fk', type: 'uuid', nullable: true })
  idHistorialFk: string | null;

  @Column({ name: 'id_seguimiento_fk', type: 'uuid', nullable: true })
  idSeguimientoFk: string | null;

  @Column({ name: 'id_hospitalizacion_fk', type: 'uuid', nullable: true })
  idHospitalizacionFk: string | null;

  @Column({
    type: 'enum',
    enum: TipoInformeClinico,
    default: TipoInformeClinico.OTRO,
  })
  tipo: TipoInformeClinico;

  @Column({
    type: 'enum',
    enum: EstadoInformeClinico,
    default: EstadoInformeClinico.BORRADOR,
  })
  estado: EstadoInformeClinico;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ name: 'comentario_clinico', type: 'text', nullable: true })
  comentarioClinico: string | null;

  @Column({ type: 'text', nullable: true })
  conclusion: string | null;

  @Column({ type: 'text', nullable: true })
  recomendaciones: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ name: 'veterinario_id', type: 'uuid' })
  veterinarioId: string;

  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: string[] | null) => value ? JSON.stringify(value) : null,
      from: (value: string | null) => {
        if (!value) return [];
        try {
          return JSON.parse(value);
        } catch {
          // Fallback for old simple-array data
          const rawParts = value.split(',');
          const healed: string[] = [];
          for (let i = 0; i < rawParts.length; i++) {
            const part = rawParts[i];
            if (part && part.startsWith('data:') && part.includes(';base64') && i + 1 < rawParts.length) {
              healed.push(part + ',' + rawParts[i + 1]);
              i++; // skip next part
            } else {
              healed.push(part);
            }
          }
          return healed;
        }
      }
    }
  })
  imagenes: string[] | null;

  @Column({ name: 'pdf_generado', type: 'varchar', length: 255, nullable: true })
  pdfGenerado: string | null;

  @Column({ name: 'datos_estructurados', type: 'jsonb', nullable: true })
  datosEstructurados: Record<string, any> | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  // Relaciones
  @ManyToOne(() => Mascota, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_mascota_fk' })
  mascota: Mascota;

  @ManyToOne(() => HistorialClinico, (hc) => hc.informes, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_historial_fk' })
  historialClinico: HistorialClinico;

  @ManyToOne(() => SeguimientoClinico, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_seguimiento_fk' })
  seguimientoClinico: SeguimientoClinico;

  @ManyToOne(() => Hospitalizacion, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_hospitalizacion_fk' })
  hospitalizacion: Hospitalizacion;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'veterinario_id' })
  veterinario: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'created_by' })
  createdByUser: Usuario;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: Usuario;
}
