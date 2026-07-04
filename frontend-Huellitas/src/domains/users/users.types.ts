export interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Usuario {
  id: string | number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  avatar_url?: string | null;
  estado_cuenta: boolean;
  intentos_fallidos: number;
  bloqueado_hasta?: string | null;
  id_rol_fk: number;
  rol?: Rol;
  ci?: string | null;
  numero_matricula?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface HorarioAtencion {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
  id_veterinario_fk: string;
  veterinario?: Usuario;
}

