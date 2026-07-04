export interface Especie {
  id: number;
  nombre: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Raza {
  id: number;
  nombre: string;
  id_especie_fk: number;
  especie?: Especie;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Mascota {
  id: string;
  nombre: string;
  fecha_nacimiento: string;
  sexo: string;
  esterilizado: boolean;
  hash_qr_identidad: string;
  id_dueno_fk?: string | null;
  id_raza_fk?: number | null;
  estado_perdido: boolean;
  url_perfil_publico?: string | null;
  foto_url?: string | null;
  caracteristicas_fisicas?: string | null;
  contacto_emergencia_telefono?: string | null;
  punto_entrega_nombre?: string | null;
  punto_entrega_direccion?: string | null;
  punto_entrega_referencia?: string | null;
  punto_entrega_lat?: number | null;
  punto_entrega_lng?: number | null;
  recompensa?: boolean;
  mensaje_encontrador?: string | null;
  dueno?: {
    id: string | number;
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
  } | null;
  raza?: Raza | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface UpdateEstadoPerdidoDto {
  estado_perdido: boolean;
  punto_entrega_nombre?: string;
  punto_entrega_direccion?: string;
  punto_entrega_referencia?: string;
  punto_entrega_lat?: number;
  punto_entrega_lng?: number;
  recompensa?: boolean;
  mensaje_encontrador?: string;
}

export interface PreRegistroUrgenciaDto {
  nombre?: string;
  sexo?: string;
  especie_nombre: string;
  contacto_nombre: string;
  contacto_telefono: string;
  id_veterinario: string;
}

export interface PreRegistroUrgenciaResponse {
  mensaje: string;
  mascotaId: string;
  hashQr: string;
  citaId: string;
  redirectUrl: string;
}

export interface VincularMascotasResponse {
  mensaje: string;
  mascotaRealId: string;
}

export interface EstadisticasMensualesResponse {
  anio: number;
  mes: string;
  totalTratados: number;
  porEspecie: { especie: string; cantidad: number }[];
  porRaza: { raza: string; cantidad: number }[];
}