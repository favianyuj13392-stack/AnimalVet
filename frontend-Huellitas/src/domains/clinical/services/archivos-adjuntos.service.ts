import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { ArchivoAdjunto } from "../clinical.types";

export const archivosAdjuntosService = {
  ...createCrudService<ArchivoAdjunto>('/archivos-adjuntos'),

  // Listar todos los archivos adjuntos de un historial clínico
  getByHistorial: async (idHistorial: string): Promise<ArchivoAdjunto[]> => {
    const { data } = await api.get<ArchivoAdjunto[]>(`/archivos-adjuntos/historial/${idHistorial}`);
    return data;
  }
};
