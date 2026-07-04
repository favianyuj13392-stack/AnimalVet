import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { ExpedienteClinico } from "../clinical.types";

export const expedientesService = {
  ...createCrudService<ExpedienteClinico>('/expediente-clinico'),

  // Obtener expediente por ID de mascota
  getByMascota: async (idMascota: string): Promise<ExpedienteClinico> => {
    const { data } = await api.get<ExpedienteClinico>(`/expediente-clinico/mascota/${idMascota}`);
    return data;
  }
};
