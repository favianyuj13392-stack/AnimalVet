import { createCrudService } from "@/shared/lib/base.service";
import { Cita } from "../appointments.types";
import api from "@/shared/lib/axios";

export const citasService = {
  ...createCrudService<Cita>('/citas'),

  // Obtener citas con filtros (por ejemplo, veterinarioId)
  getAll: async (params?: { veterinarioId?: string; mascotaId?: string; estado?: string; fecha?: string; clienteId?: string }): Promise<Cita[]> => {
    const { data } = await api.get<Cita[]>('/citas', { params });
    console.log('Citas obtenidas con filtros:', data);
    console.log('Parámetros de consulta:', params);
    return data;
  },

  // Actualizar estado personalizado
  updateEstado: async (id: string, estado: string, motivo_cancelacion?: string): Promise<Cita> => {
    const { data } = await api.patch<Cita>(`/citas/${id}/estado`, { estado, motivo_cancelacion });
    return data;
  },

  // Obtener Reporte Analítico Anual
  getReporteAnual: async (anio: number): Promise<any> => {
    const { data } = await api.get<any>(`/citas/reportes/anual`, { params: { anio } });
    return data;
  },

  getDisponibilidad: async (veterinarioId: string, fecha: string) => {
    // Llamamos al nuevo endpoint de NestJS
    const res = await api.get(`/citas/disponibilidad/${veterinarioId}`, {
      params: { fecha }
    });
    return res.data; // Retorna: [{ hora: "09:00", ocupado: false }, ...]
  },
  // Restaurar cita cancelada (borrado lógico)
  restore: async (id: string): Promise<Cita> => {
    const { data } = await api.post<Cita>(`/citas/${id}/restaurar`);
    return data;
  },

  // Historiales cerrados pendientes de cobro — solo datos de facturación, sin info clínica
  getPendientesCobro: async (mascotaId?: string): Promise<any[]> => {
    const params: any = {};
    if (mascotaId) params.mascotaId = mascotaId;
    const { data } = await api.get<any[]>("/citas/pendientes-cobro", { params });
    return data;
  },
};
