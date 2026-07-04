import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { Vacuna } from "../clinical.types";

export const vaccinesCatalogService = {
  ...createCrudService<Vacuna>('/catalogo-vacunas'),
  activar: async (id: string | number): Promise<void> => {
    await api.post(`/catalogo-vacunas/${id}/activar`);
  }
};
