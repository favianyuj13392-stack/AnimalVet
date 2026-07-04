import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { Raza } from "../pets.types";

export const breedsService = {
  ...createCrudService<Raza>('/razas'),
  activar: async (id: string | number): Promise<void> => {
    await api.post(`/razas/${id}/activar`);
  }
};
