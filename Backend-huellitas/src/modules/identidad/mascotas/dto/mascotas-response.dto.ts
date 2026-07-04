import { Mascota } from '../entities/mascota.entity';

export class MascotaResponseDto {
  id: string;
  nombre: string;
  sexo: string;
  fecha_nacimiento: Date;
  esterilizado: boolean;
  estado_perdido: boolean;
  hash_qr_identidad: string;
  id_dueno_fk: string;
  id_raza_fk: number;
  foto_url: string | null;
  caracteristicas_fisicas: string | null;
  contacto_emergencia_telefono: string | null;
  punto_entrega_nombre: string | null;
  punto_entrega_direccion: string | null;
  punto_entrega_referencia: string | null;
  punto_entrega_lat: number | null;
  punto_entrega_lng: number | null;
  recompensa: boolean;
  mensaje_encontrador: string | null;
  deletedAt: Date | null;
  dueno: { id: string; nombres: string; apellidos: string; email: string; telefono: string | null } | null;
  raza: { id: number; nombre: string; id_especie_fk: number; especie: { id: number; nombre: string } | null } | null;

  static fromEntity(entity: Mascota): MascotaResponseDto {
    const dto = new MascotaResponseDto();
    dto.id = entity.id;
    dto.nombre = entity.nombre;
    dto.sexo = entity.sexo;
    dto.fecha_nacimiento = entity.fecha_nacimiento;
    dto.esterilizado = entity.esterilizado;
    dto.estado_perdido = entity.estado_perdido;
    dto.hash_qr_identidad = entity.hash_qr_identidad;
    dto.id_dueno_fk = entity.id_dueno_fk;
    dto.id_raza_fk = entity.id_raza_fk;
    dto.foto_url = entity.foto_url ?? null;
    dto.caracteristicas_fisicas = entity.caracteristicas_fisicas ?? null;
    dto.contacto_emergencia_telefono = entity.contacto_emergencia_telefono ?? null;
    dto.punto_entrega_nombre = entity.punto_entrega_nombre ?? null;
    dto.punto_entrega_direccion = entity.punto_entrega_direccion ?? null;
    dto.punto_entrega_referencia = entity.punto_entrega_referencia ?? null;
    dto.punto_entrega_lat = entity.punto_entrega_lat ?? null;
    dto.punto_entrega_lng = entity.punto_entrega_lng ?? null;
    dto.recompensa = entity.recompensa ?? false;
    dto.mensaje_encontrador = entity.mensaje_encontrador ?? null;
    dto.deletedAt = (entity as any).deletedAt ?? null;
    const d = (entity as any).dueno;
    dto.dueno = d
      ? { id: d.id, nombres: d.nombres, apellidos: d.apellidos, email: d.email, telefono: d.telefono ?? null }
      : null;
    const r = (entity as any).raza;
    dto.raza = r
      ? { id: r.id, nombre: r.nombre, id_especie_fk: r.id_especie_fk, especie: r.especie ? { id: r.especie.id, nombre: r.especie.nombre } : null }
      : null;
    return dto;
  }

  static fromEntities(entities: Mascota[]): MascotaResponseDto[] {
    return entities.map(entity => this.fromEntity(entity));
  }
}
