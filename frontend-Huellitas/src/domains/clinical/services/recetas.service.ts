import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { Receta, CreateRecetaDto } from "../clinical.types";

export const recetasService = {
  ...createCrudService<Receta>('/recetas'),

  create: async (payload: CreateRecetaDto): Promise<Receta> => {
    const { data } = await api.post<Receta>('/recetas', payload);
    return data;
  },

  // Listar todas las recetas de un historial clínico
  getByHistorial: async (idHistorial: string): Promise<Receta[]> => {
    const { data } = await api.get<Receta[]>(`/recetas/historial/${idHistorial}`);
    return data;
  },

  // Sobrescribir update para usar PUT como requiere el backend
  update: async (id: string | number, payload: { indicaciones_grales: string }): Promise<Receta> => {
    const { data } = await api.put<Receta>(`/recetas/${id}`, payload);
    return data;
  }
};
