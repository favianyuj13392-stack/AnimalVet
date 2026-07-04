import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";

export interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number | string;        // API puede devolver decimal como string
  duracion_minutos: number | string; // idem
  requiereVeterinario: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export const servicesService = {
  ...createCrudService<Servicio>('/servicios'),
  activar: async (id: string | number): Promise<void> => {
    await api.post(`/servicios/${id}/activar`);
  }
};
