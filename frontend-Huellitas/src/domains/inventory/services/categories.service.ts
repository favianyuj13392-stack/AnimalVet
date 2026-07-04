import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { Categoria } from "../inventory.types";

export const categoriesService = {
  ...createCrudService<Categoria>('/categorias-producto'),
  activar: async (id: string | number): Promise<void> => {
    await api.post(`/categorias-producto/${id}/activar`);
  }
};
