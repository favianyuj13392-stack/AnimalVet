import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { HorarioAtencion } from "../users.types";

export const horariosAtencionService = {
  ...createCrudService<HorarioAtencion>('/horarios-atencion'),

  // Obtener todos los horarios activos de un veterinario
  getAllActive: async (idVeterinario: string): Promise<HorarioAtencion[]> => {
    const { data } = await api.get<HorarioAtencion[]>(`/horarios-atencion/veterinario/${idVeterinario}`);
    return data;
  },

  // Desactivar un horario
  desactivar: async (id: string): Promise<void> => {
    await api.patch(`/horarios-atencion/${id}/desactivar`);
  },

  // Obtener fechas bloqueadas
  getBloqueos: async (): Promise<any[]> => {
    const { data } = await api.get<any[]>('/horarios-atencion/bloqueos');
    return data;
  },

  // Crear un bloqueo de fecha
  createBloqueo: async (payload: { fecha: string; motivo: string; id_veterinario_fk?: string | null }): Promise<any> => {
    const { data } = await api.post<any>('/horarios-atencion/bloqueos', payload);
    return data;
  },

  // Eliminar (Desbloquear) una fecha
  deleteBloqueo: async (id: string): Promise<void> => {
    await api.delete(`/horarios-atencion/bloqueos/${id}`);
  }
};
