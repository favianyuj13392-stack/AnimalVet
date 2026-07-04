import api from "@/shared/lib/axios";

export interface Lote {
  id: string;
  numeroLote: string;
  fechaVencimiento: string;
  cantidadInicial: number;
  cantidadActual: number;
  idProductoFk: string;
  producto?: { nombre: string; unidadMedida: string };
  createdAt: string;
  deletedAt?: string | null;
}

export const lotesService = {
  getAll: async (productoId?: string): Promise<Lote[]> => {
    const { data } = await api.get<Lote[]>("/lotes-caducidad", {
      params: productoId ? { productoId } : undefined,
    });
    return data;
  },
  getAlertas: async (dias?: number): Promise<Lote[]> => {
    const { data } = await api.get<Lote[]>("/lotes-caducidad/alertas/por-vencer", {
      params: dias ? { dias } : undefined,
    });
    return data;
  },
  getOne: async (id: string): Promise<Lote> => {
    const { data } = await api.get<Lote>(`/lotes-caducidad/${id}`);
    return data;
  },
  crear: async (payload: any): Promise<Lote> => {
    const { data } = await api.post<Lote>("/lotes-caducidad", payload);
    return data;
  },
  update: async (id: string, payload: any): Promise<Lote> => {
    const { data } = await api.patch<Lote>(`/lotes-caducidad/${id}`, payload);
    return data;
  },
};
