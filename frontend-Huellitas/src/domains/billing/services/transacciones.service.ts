import api from "@/shared/lib/axios";

export interface TransaccionCaja {
  id: string;
  totalCobrado: number;
  subtotal?: number;
  descuento?: number;
  metodoPago: string;
  estadoTransaccion: string;
  fechaTransaccion?: string;
  turno?: string | null;
  id_cajero_fk: string;
  id_cliente_fk?: string | null;
  id_historial_fk?: string | null;
  id_hospitalizacion_fk?: string | null;
  cajero?: { nombres: string; apellidos: string };
  cliente?: { nombres: string; apellidos: string } | null;
  createdAt: string;
  detalles?: DetalleTransaccion[];
}

export interface DetalleTransaccion {
  id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  id_producto_fk?: string;
  id_servicio_fk?: number;
  producto?: { nombre: string };
  servicio?: { nombre: string };
}

export const transaccionesService = {
  getAll: async (filtros?: { cajeroId?: string; clienteId?: string; fecha?: string; estado?: string }): Promise<TransaccionCaja[]> => {
    const params = new URLSearchParams();
    if (filtros?.cajeroId)  params.set("cajeroId", filtros.cajeroId);
    if (filtros?.clienteId) params.set("clienteId", filtros.clienteId);
    if (filtros?.fecha)     params.set("fecha", filtros.fecha);
    if (filtros?.estado)    params.set("estado", filtros.estado);
    const query = params.toString() ? `?${params.toString()}` : "";
    const { data } = await api.get<TransaccionCaja[]>(`/transacciones-caja${query}`);
    return data;
  },
  getOne: async (id: string): Promise<TransaccionCaja> => {
    const { data } = await api.get<TransaccionCaja>(`/transacciones-caja/${id}`);
    return data;
  },
  descargarComprobante: async (id: string): Promise<void> => {
    const response = await api.get(`/transacciones-caja/${id}/comprobante`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `comprobante-${id.slice(-8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  anular: async (id: string): Promise<void> => {
    await api.patch(`/transacciones-caja/${id}/anular`);
  },
  crearDesdeHistorial: async (idHistorial: string, payload: any): Promise<TransaccionCaja> => {
    const { data } = await api.post<TransaccionCaja>(`/transacciones-caja/desde-historial/${idHistorial}`, payload);
    return data;
  },
  crearDesdeHospitalizacion: async (idHosp: string, payload: any): Promise<TransaccionCaja> => {
    const { data } = await api.post<TransaccionCaja>(`/transacciones-caja/desde-hospitalizacion/${idHosp}`, payload);
    return data;
  },
  crear: async (payload: any): Promise<TransaccionCaja> => {
    const { data } = await api.post<TransaccionCaja>("/transacciones-caja", payload);
    return data;
  },
};
