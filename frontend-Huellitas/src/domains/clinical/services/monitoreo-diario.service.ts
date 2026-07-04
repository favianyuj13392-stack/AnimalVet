import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { MonitoreoDiario, CreateMonitoreoDiarioDto, UpdateMonitoreoDiarioDto } from "../clinical.types";

export const monitoreoDiarioService = {
  ...createCrudService<MonitoreoDiario>('/monitoreo-diario'),

  create: async (payload: CreateMonitoreoDiarioDto): Promise<MonitoreoDiario> => {
    const { data } = await api.post<MonitoreoDiario>('/monitoreo-diario', payload);
    return data;
  },

  update: async (id: string | number, payload: UpdateMonitoreoDiarioDto): Promise<MonitoreoDiario> => {
    const { data } = await api.patch<MonitoreoDiario>(`/monitoreo-diario/${id}`, payload);
    return data;
  },

  getByHospitalizacion: async (idHospitalizacion: string): Promise<MonitoreoDiario[]> => {
    const { data } = await api.get<MonitoreoDiario[]>(`/monitoreo-diario/hospitalizacion/${idHospitalizacion}`);
    return data;
  }
};
