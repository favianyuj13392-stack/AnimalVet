import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../../../identidad/usuarios/entities/usuario.entity';

@Entity('logs_sistema')
export class LogSistema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_usuario_fk', type: 'uuid', nullable: true })
  idUsuarioFk: string | null;

  @Column({ type: 'varchar', length: 100 })
  accion: string;

  @Column({ type: 'varchar', length: 50 })
  categoria: string;

  @Column({ name: 'tabla_afectada', type: 'varchar', length: 100, nullable: true })
  tablaAfectada: string | null;

  @Column({ name: 'registro_id', type: 'varchar', length: 100, nullable: true })
  registroId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  detalles: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario_fk' })
  usuario: Usuario | null;
}
