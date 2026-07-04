import api from "@/shared/lib/axios";

export const reportesService = {
  getFinanciero: async (params?: { fecha_inicio?: string; fecha_fin?: string }): Promise<any> => {
    const { data } = await api.get("/reportes/financiero", { params });
    return data;
  },
  getFinancieroPorCajero: async (cajeroId: string, params?: { fecha_inicio?: string; fecha_fin?: string }): Promise<any> => {
    const { data } = await api.get(`/reportes/financiero/cajero/${cajeroId}`, { params });
    return data;
  },
  getCitas: async (params?: { fecha_inicio?: string; fecha_fin?: string; veterinarioId?: string }): Promise<any> => {
    const { data } = await api.get("/reportes/citas", { params });
    return data;
  },
  getInventario: async (): Promise<any> => {
    const { data } = await api.get("/reportes/inventario");
    return data;
  },
  getLotesPorVencer: async (dias?: string): Promise<any> => {
    const { data } = await api.get("/reportes/lotes-por-vencer", { params: dias ? { dias } : {} });
    return data;
  },
  getVacunasPendientes: async (dias?: string): Promise<any> => {
    const { data } = await api.get("/reportes/vacunas-pendientes", { params: dias ? { dias } : {} });
    return data;
  },
  getFichaMascota: async (mascotaId: string): Promise<any> => {
    const { data } = await api.get(`/reportes/ficha-mascota/${mascotaId}`);
    return data;
  },
  getDashboard: async (anio: number, mes?: number): Promise<any> => {
    const params: any = { anio };
    if (mes) params.mes = mes;
    const { data } = await api.get('/reportes/dashboard', { params });
    return data;
  },
};
