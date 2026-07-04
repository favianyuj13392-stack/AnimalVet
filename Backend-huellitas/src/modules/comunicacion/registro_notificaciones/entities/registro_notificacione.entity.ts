import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';
import { Cita } from '../../../clinica/citas/entities/cita.entity';
import { Mascota } from '../../../identidad/mascotas/entities/mascota.entity';

@Entity('registro_notificaciones')
export class RegistroNotificacion extends BaseEntity {
  @Column({ name: 'tipo_notificacion', type: 'varchar', length: 50 })
  tipoNotificacion: string;

  @Column({ name: 'canal_envio', type: 'varchar', length: 30 })
  canalEnvio: string; // 'WhatsApp', 'Email', 'SMS'

  @Column({ name: 'cuerpo_mensaje', type: 'text' })
  cuerpoMensaje: string;

  @Column({ name: 'estado_envio', type: 'varchar', length: 20 })
  estadoEnvio: string; // 'Pendiente', 'Enviado', etc.

  @Column({ name: 'id_usuario_fk', type: 'uuid', nullable: true })
  idUsuarioFk: string | null;

  @Column({ name: 'id_cita_fk', type: 'uuid', nullable: true })
  idCitaFk: string | null;

  @Column({ name: 'id_mascota_fk', type: 'uuid', nullable: true })
  idMascotaFk: string | null;

  // 🔗 LLAVES FORÁNEAS
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_fk' })
  usuario: Usuario;

  @ManyToOne(() => Cita)
  @JoinColumn({ name: 'id_cita_fk' })
  cita: Cita;

  @ManyToOne(() => Mascota)
  @JoinColumn({ name: 'id_mascota_fk' })
  mascota: Mascota;
}