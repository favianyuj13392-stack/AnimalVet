import api from "@/shared/lib/axios";

export interface MovimientoKardex {
  id: string;
  tipo_movimiento: string;
  cantidad: number;
  saldo_resultante: number;
  motivo_detalle?: string;
  id_producto_fk: string;
  id_usuario_fk?: string;
  id_transaccion_fk?: string;
  id_historial_fk?: string;
  producto?: { nombre: string };
  createdBy?: string;
  createdAt: string;
}

export const kardexService = {
  getAll: async (productoId?: string): Promise<MovimientoKardex[]> => {
    const { data } = await api.get<MovimientoKardex[]>("/kardex-inventario", {
      params: productoId ? { productoId } : undefined,
    });
    return data;
  },
  getOne: async (id: string): Promise<MovimientoKardex> => {
    const { data } = await api.get<MovimientoKardex>(`/kardex-inventario/${id}`);
    return data;
  },
  registrar: async (payload: any): Promise<MovimientoKardex> => {
    const { data } = await api.post<MovimientoKardex>("/kardex-inventario", payload);
    return data;
  },
};
