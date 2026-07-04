import api from "@/shared/lib/axios";

export interface EscaneoQr {
  id: string;
  latitud?: number;
  longitud?: number;
  user_agent?: string;
  notificacion_enviada?: boolean;
  id_mascota_fk: string;
  mascota?: { nombre: string; hash_qr_identidad: string };
  createdAt: string;
}

export const escaneosQrService = {
  getAll: async (): Promise<EscaneoQr[]> => {
    const { data } = await api.get<EscaneoQr[]>("/escaneos-qr");
    return data;
  },
  getPorMascota: async (mascotaId: string): Promise<EscaneoQr[]> => {
    const { data } = await api.get<EscaneoQr[]>(`/escaneos-qr/mascota/${mascotaId}`);
    return data;
  },
};
