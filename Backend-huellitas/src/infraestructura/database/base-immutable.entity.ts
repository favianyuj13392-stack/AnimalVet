import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * Base entity for immutable tables that only record creation timestamps
 * and do NOT support soft deletes or updates.
 * 
 * Used for:
 * - kardex_inventario
 * - registro_escaneos_qr
 */
export abstract class BaseImmutableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
