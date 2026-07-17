import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../../infraestructura/database/base.entity';

@Entity('catalogo_patologias')
export class Patologia extends BaseEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  nombre: string;

  @Column({ name: 'codigo_cie', type: 'varchar', length: 20, nullable: true })
  codigoCie: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;
}
