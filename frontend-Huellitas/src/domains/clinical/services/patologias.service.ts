import api from "@/shared/lib/axios";
import { Patologia } from "../clinical.types";

export const patologiasService = {
  getAll: async (): Promise<Patologia[]> => {
    const { data } = await api.get<Patologia[]>('/patologias');
    return data;
  },
};
