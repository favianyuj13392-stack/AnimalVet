import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { Cita } from '../../../clinica/citas/entities/cita.entity';

@Entity('interacciones_bot')
export class InteraccionBot extends BaseEntity {
  // Nota: Usamos una función de PostgreSQL para el default si no se envía
  @Column({ name: 'sesion_id', type: 'varchar', length: 100, default: () => 'gen_random_uuid()' })
  sesionId: string;

  @Column({ name: 'numero_whatsapp', type: 'varchar', length: 20 })
  numeroWhatsapp: string;

  @Column({ name: 'mensaje_usuario', type: 'text' })
  mensajeUsuario: string;

  @Column({ name: 'intencion_detectada', type: 'varchar', length: 50 })
  intencionDetectada: string;

  @Column({ name: 'respuesta_bot', type: 'text' })
  respuestaBot: string;

  @Column({ name: 'id_cliente_fk', type: 'uuid', nullable: true })
  id_cliente_fk: string;

  @Column({ name: 'id_cita_generada_fk', type: 'uuid', nullable: true })
  id_cita_generada_fk: string;

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_cliente_fk' })
  cliente: Usuario;

  @ManyToOne(() => Cita)
  @JoinColumn({ name: 'id_cita_generada_fk' })
  citaGenerada: Cita;
}