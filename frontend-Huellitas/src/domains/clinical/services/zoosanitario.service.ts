import api from "@/shared/lib/axios";

export interface Desparasitacion {
  id: string;
  id_mascota_fk: string;
  fecha: string;
  producto_utilizado: string;
  id_producto_fk?: string;
  peso_kg?: number;
  fecha_proxima?: string;
  id_veterinario_fk?: string;
  id_historial_fk?: string;
  notas?: string;
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
  };
}

export interface Cirugia {
  id: string;
  id_mascota_fk: string;
  fecha: string;
  tipo_cirugia: string;
  observaciones?: string;
  id_veterinario_fk?: string;
  id_historial_fk?: string;
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
  };
}

export interface TratamientoZoo {
  id: string;
  id_mascota_fk: string;
  fecha: string;
  descripcion: string;
  id_veterinario_fk?: string;
  id_historial_fk?: string;
  veterinario?: {
    id: string;
    nombres: string;
    apellidos: string;
  };
}

export interface ProgramaItem {
  id: number;
  especie: string;
  edadTexto: string;
  edadDiasDesde?: number;
  edadDiasHasta?: number;
  detalle: string;
  observaciones?: string;
  orden: number;
  activo: boolean;
}

export const zoosanitarioService = {
  // Orquestador
  getTarjetaControl: async (mascotaId: string): Promise<any> => {
    const { data } = await api.get<any>(`/zoosanitario/mascota/${mascotaId}`);
    return data;
  },

  // Desparasitaciones
  createDesparasitacion: async (payload: any): Promise<Desparasitacion> => {
    const { data } = await api.post<Desparasitacion>('/zoosanitario/desparasitaciones', payload);
    return data;
  },
  listDesparasitaciones: async (mascotaId: string): Promise<Desparasitacion[]> => {
    const { data } = await api.get<Desparasitacion[]>(`/zoosanitario/desparasitaciones?mascotaId=${mascotaId}`);
    return data;
  },
  updateDesparasitacion: async (id: string, payload: any): Promise<Desparasitacion> => {
    const { data } = await api.put<Desparasitacion>(`/zoosanitario/desparasitaciones/${id}`, payload);
    return data;
  },
  deleteDesparasitacion: async (id: string): Promise<any> => {
    const { data } = await api.delete<any>(`/zoosanitario/desparasitaciones/${id}`);
    return data;
  },

  // Cirugias
  createCirugia: async (payload: any): Promise<Cirugia> => {
    const { data } = await api.post<Cirugia>('/zoosanitario/cirugias', payload);
    return data;
  },
  listCirugias: async (mascotaId: string): Promise<Cirugia[]> => {
    const { data } = await api.get<Cirugia[]>(`/zoosanitario/cirugias?mascotaId=${mascotaId}`);
    return data;
  },
  updateCirugia: async (id: string, payload: any): Promise<Cirugia> => {
    const { data } = await api.put<Cirugia>(`/zoosanitario/cirugias/${id}`, payload);
    return data;
  },
  deleteCirugia: async (id: string): Promise<any> => {
    const { data } = await api.delete<any>(`/zoosanitario/cirugias/${id}`);
    return data;
  },

  // Tratamientos Libres
  createTratamiento: async (payload: any): Promise<TratamientoZoo> => {
    const { data } = await api.post<TratamientoZoo>('/zoosanitario/tratamientos', payload);
    return data;
  },
  listTratamientos: async (mascotaId: string): Promise<TratamientoZoo[]> => {
    const { data } = await api.get<TratamientoZoo[]>(`/zoosanitario/tratamientos?mascotaId=${mascotaId}`);
    return data;
  },
  updateTratamiento: async (id: string, payload: any): Promise<TratamientoZoo> => {
    const { data } = await api.put<TratamientoZoo>(`/zoosanitario/tratamientos/${id}`, payload);
    return data;
  },
  deleteTratamiento: async (id: string): Promise<any> => {
    const { data } = await api.delete<any>(`/zoosanitario/tratamientos/${id}`);
    return data;
  },

  // Programa Sanitario (Configuración)
  createProgramaItem: async (payload: any): Promise<ProgramaItem> => {
    const { data } = await api.post<ProgramaItem>('/zoosanitario/programa', payload);
    return data;
  },
  listProgramaItems: async (especie?: string): Promise<ProgramaItem[]> => {
    const especieQuery = especie ? `?especie=${especie}` : '';
    const { data } = await api.get<ProgramaItem[]>(`/zoosanitario/programa${especieQuery}`);
    return data;
  },
  updateProgramaItem: async (id: number, payload: any): Promise<ProgramaItem> => {
    const { data } = await api.put<ProgramaItem>(`/zoosanitario/programa/${id}`, payload);
    return data;
  },
  deleteProgramaItem: async (id: number): Promise<any> => {
    const { data } = await api.delete<any>(`/zoosanitario/programa/${id}`);
    return data;
  },
};
