import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import {
  Mascota,
  PreRegistroUrgenciaDto,
  PreRegistroUrgenciaResponse,
  VincularMascotasResponse,
  EstadisticasMensualesResponse,
  UpdateEstadoPerdidoDto,
} from "../pets.types";

export const mascotasService = {
  ...createCrudService<Mascota>('/mascotas'),

  // Sobrescribir getAll para soportar parámetros de búsqueda y filtro de activos
  getAll: async (params?: { search?: string; soloActivos?: string }): Promise<Mascota[]> => {
    const { data } = await api.get<Mascota[]>('/mascotas', { params });
    return data;
  },

  activar: async (id: string | number): Promise<void> => {
    await api.post(`/mascotas/${id}/activar`);
  },

  preRegistroUrgencia: async (payload: PreRegistroUrgenciaDto): Promise<PreRegistroUrgenciaResponse> => {
    const { data } = await api.post<PreRegistroUrgenciaResponse>('/mascotas/urgencia', payload);
    return data;
  },

  vincularDuplicado: async (idTemporal: string | number, idReal: string | number): Promise<VincularMascotasResponse> => {
    const { data } = await api.post<VincularMascotasResponse>(`/mascotas/${idTemporal}/vincular/${idReal}`);
    return data;
  },

  getEstadisticasMensuales: async (): Promise<EstadisticasMensualesResponse> => {
    const { data } = await api.get<EstadisticasMensualesResponse>('/mascotas/reportes/estadisticas-mensuales');
    return data;
  },

  getMisMascotas: async (clienteId: string): Promise<Mascota[]> => {
    const { data } = await api.get<Mascota[]>('/mascotas/mis-mascotas', { params: { clienteId } });
    return data;
  },

  registrarMiMascota: async (payload: Partial<Mascota>): Promise<Mascota> => {
    const { data } = await api.post<Mascota>('/mascotas', payload);
    return data;
  },

  actualizarParcial: async (id: string, payload: UpdateEstadoPerdidoDto | Partial<Mascota>): Promise<Mascota> => {
    const { data } = await api.patch<Mascota>(`/mascotas/${id}`, payload);
    return data;
  },
};
