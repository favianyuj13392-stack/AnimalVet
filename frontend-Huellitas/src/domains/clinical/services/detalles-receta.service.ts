import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { DetalleReceta, CreateDetalleRecetaDto, UpdateDetalleRecetaDto } from "../clinical.types";

export const detallesRecetaService = {
  ...createCrudService<DetalleReceta>('/detalles-receta'),

  // Agregar un detalle a una receta existente (POST /api/detalles-receta/:idReceta)
  addDetalle: async (idReceta: string, payload: CreateDetalleRecetaDto): Promise<DetalleReceta> => {
    const { data } = await api.post<DetalleReceta>(`/detalles-receta/${idReceta}`, payload);
    return data;
  },

  // Sobrescribir update para usar PUT como requiere el backend
  update: async (id: string | number, payload: UpdateDetalleRecetaDto): Promise<DetalleReceta> => {
    const { data } = await api.put<DetalleReceta>(`/detalles-receta/${id}`, payload);
    return data;
  }
};
