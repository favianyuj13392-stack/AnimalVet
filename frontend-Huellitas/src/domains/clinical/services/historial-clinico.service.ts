import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { HistorialClinico } from "../clinical.types";

export const historialClinicoService = {
  ...createCrudService<HistorialClinico>('/historial-clinico'),


  finalizarConsultaTransaccional: async (payload: any): Promise<any> => {
    // Apunta a la ruta @Post('finalizar') que creamos en el controlador
    const { data } = await api.post('/historial-clinico/finalizar', payload);
    return data;
  },

  // Desactivar un registro (Eliminación Lógica)
  desactivar: async (id: string): Promise<void> => {
    await api.delete(`/historial-clinico/${id}/desactivar`);
  },

  // Activar un registro desactivado (Restaurar)
  activar: async (id: string): Promise<void> => {
    await api.post(`/historial-clinico/${id}/activar`);
  },

  // Sobrescribir delete para que llame a la eliminación lógica
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/historial-clinico/${id}/desactivar`);
  },

  // Expediente completo para el cliente (solo sus mascotas)
  getByMiMascota: async (mascotaId: string): Promise<any> => {
    const { data } = await api.get(`/historial-clinico/mi-mascota/${mascotaId}`);
    return data;
  },

  // Historiales cerrados pendientes de cobro (para cajero)
  getPendientesCobro: async (): Promise<any[]> => {
    const { data } = await api.get('/historial-clinico/pendientes-cobro');
    return data;
  },

  // Historial de signos vitales de una mascota (para triaje)
  getByMascota: async (mascotaId: string, beforeDate?: string): Promise<any[]> => {
    const { data } = await api.get('/historial-clinico', {
      params: { mascotaId, ...(beforeDate ? { before: beforeDate } : {}) }
    });
    return data;
  },

  // Obtener todas las plantillas de patologías
  getPlantillasPatologia: async (): Promise<any[]> => {
    const { data } = await api.get('/plantillas-patologia');
    return data;
  },
};
