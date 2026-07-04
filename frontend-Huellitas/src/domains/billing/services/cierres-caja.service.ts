import api from "@/shared/lib/axios";

export interface CierreCaja {
  id: string;
  fecha_turno: string;
  turno: string;
  total_efectivo: number;
  total_qr: number;
  total_tarjeta: number;
  total_general: number;
  total_descuentos: number;
  total_transacciones: number;
  id_cajero_fk: string;
  cajero?: { nombres: string; apellidos: string };
  createdAt: string;
}

export const cierresCajaService = {
  getAll: async (): Promise<CierreCaja[]> => {
    const { data } = await api.get<CierreCaja[]>("/cierres-caja");
    return data;
  },
  getOne: async (id: string): Promise<CierreCaja> => {
    const { data } = await api.get<CierreCaja>(`/cierres-caja/${id}`);
    return data;
  },
  crear: async (payload: any): Promise<CierreCaja> => {
    const { data } = await api.post<CierreCaja>("/cierres-caja", payload);
    return data;
  },
};
