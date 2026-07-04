import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { VacunaAplicada, CreateVacunasAplicadaDto } from "../clinical.types";

export const vacunasAplicadasService = {
  ...createCrudService<VacunaAplicada>('/vacunas-aplicadas'),

  create: async (payload: CreateVacunasAplicadaDto): Promise<VacunaAplicada> => {
    const { data } = await api.post<VacunaAplicada>('/vacunas-aplicadas', payload);
    return data;
  },

  // Listar vacunas aplicadas de un historial clínico
  getByHistorial: async (idHistorial: string): Promise<VacunaAplicada[]> => {
    const { data } = await api.get<VacunaAplicada[]>(`/vacunas-aplicadas/historial/${idHistorial}`);
    return data;
  },

  // Alertas de vacunas próximas o vencidas (±30 días) — filtradas por dueño si es Cliente
  getAlertas: async (): Promise<any[]> => {
    const { data } = await api.get<any[]>('/vacunas-aplicadas/alertas');
    return data;
  },
};
