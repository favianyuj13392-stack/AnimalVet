import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { Hospitalizacion, CreateHospitalizacioneDto, UpdateHospitalizacioneDto } from "../clinical.types";

export interface CreateHospitalizacionInsumoDto {
  id_hospitalizacion_fk: string;
  id_producto_fk?: string;
  id_servicio_fk?: number;
  cantidad: number;
  notas?: string;
}
export const hospitalizacionesService = {
  ...createCrudService<Hospitalizacion>('/hospitalizaciones'),

  create: async (payload: CreateHospitalizacioneDto): Promise<Hospitalizacion> => {
    const { data } = await api.post<Hospitalizacion>('/hospitalizaciones', payload);
    return data;
  },

  update: async (id: string | number, payload: UpdateHospitalizacioneDto): Promise<Hospitalizacion> => {
    const { data } = await api.patch<Hospitalizacion>(`/hospitalizaciones/${id}`, payload);
    return data;
  },

  getByMascota: async (idMascota: string): Promise<Hospitalizacion[]> => {
    const { data } = await api.get<Hospitalizacion[]>(`/hospitalizaciones/mascota/${idMascota}`);
    return data;
  },
};
export const hospitalizacionInsumosService = {
  create: async (payload: CreateHospitalizacionInsumoDto): Promise<{ mensaje: string }> => {
    const { data } = await api.post<{ mensaje: string }>('/hospitalizaciones-insumos', payload);
    return data;
  }
};