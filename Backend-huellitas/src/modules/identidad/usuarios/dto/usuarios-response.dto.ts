import { Usuario } from '../entities/usuario.entity';

export class UsuarioResponseDto {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  avatar_url: string | null;
  id_rol_fk: number;
  estado_cuenta: boolean;
  intentos_fallidos: number;
  bloqueado_hasta: Date | null;
  created_at: Date;
  updated_at: Date;
  deletedAt: Date | null;
  created_by: string | null;
  ci: string | null;
  numero_matricula: string | null;
  rol?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };

  static fromEntity(entity: Usuario): UsuarioResponseDto {
    const dto = new UsuarioResponseDto();
    dto.id = entity.id;
    dto.nombres = entity.nombres;
    dto.apellidos = entity.apellidos;
    dto.email = entity.email;
    dto.telefono = entity.telefono;
    dto.avatar_url = entity.avatar_url ?? null;
    dto.id_rol_fk = entity.id_rol_fk;
    dto.estado_cuenta = entity.estado_cuenta;
    dto.intentos_fallidos = entity.intentos_fallidos ?? 0;
    dto.bloqueado_hasta = entity.bloqueado_hasta ?? null;
    dto.created_at = entity.createdAt;
    dto.updated_at = entity.updatedAt;
    dto.deletedAt = (entity as any).deletedAt ?? null;
    dto.created_by = entity.created_by ?? entity.creador?.id ?? null;
    dto.ci = entity.ci ?? null;
    dto.numero_matricula = entity.numero_matricula ?? null;
    
    dto.rol = entity.rol ? {
      id: entity.rol.id,
      nombre: entity.rol.nombre,
      descripcion: entity.rol.descripcion,
    } : undefined;

    return dto;
  }

  static fromEntities(entities: Usuario[]): UsuarioResponseDto[] {
    return entities.map(entity => this.fromEntity(entity));
  }
}
