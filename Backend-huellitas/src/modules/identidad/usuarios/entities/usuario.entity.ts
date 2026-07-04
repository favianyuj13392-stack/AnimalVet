import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';
import { Role } from '../../../core/roles/entities/role.entity';
import { Exclude } from 'class-transformer';

@Entity('usuarios')
export class Usuario extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100 })
  apellidos: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ci: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatar_url: string | null;

  @Column({ name: 'numero_matricula', type: 'varchar', length: 50, nullable: true })
  numero_matricula: string | null;

  @Column({ name: 'estado_cuenta', type: 'boolean', default: true })
  estado_cuenta: boolean;

  @Column({ name: 'intentos_fallidos', type: 'integer', default: 0 })
  intentos_fallidos: number;

  @Column({ name: 'bloqueado_hasta', type: 'timestamp', nullable: true })
  bloqueado_hasta: Date | null;

  @Column({ name: 'otp_codigo', type: 'varchar', length: 6, nullable: true })
  otp_codigo: string | null;

  @Column({ name: 'otp_expira_en', type: 'timestamp', nullable: true })
  otp_expira_en: Date | null;

  @Column({ type: 'int' })
  id_rol_fk: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string | null;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updated_by: string | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creador: Usuario;

  // 🔗 LLAVE FORÁNEA: id_rol_fk
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'id_rol_fk' })
  rol: Role;
}