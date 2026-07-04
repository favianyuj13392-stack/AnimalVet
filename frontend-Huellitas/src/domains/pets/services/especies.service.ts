import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { Especie } from "../../pets/pets.types";

export const speciesService = {
  ...createCrudService<Especie>('/especies'),
  activar: async (id: string | number): Promise<void> => {
    await api.post(`/especies/${id}/activar`);
  }
};