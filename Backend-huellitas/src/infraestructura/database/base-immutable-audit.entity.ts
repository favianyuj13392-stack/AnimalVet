import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * Base entity for immutable tables that only record creation timestamps
 * with audit trail but DO NOT support updates, soft deletes, or update tracking.
 * 
 * Used for:
 * - cierres_caja (has created_at and created_by FK, no updated_at, no deleted_at)
 * 
 * Note: The created_by column must be explicitly defined in the entity
 * as a @Column and @ManyToOne relationship, not inherited.
 */
export abstract class BaseImmutableAuditEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // created_by must be defined in the concrete entity class
}
