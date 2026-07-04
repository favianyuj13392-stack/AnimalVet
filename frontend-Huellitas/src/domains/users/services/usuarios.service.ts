import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { Usuario } from "../users.types";

export const usuariosService = {
  ...createCrudService<Usuario>('/usuarios'),

  getClientes: async (): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>('/usuarios/clientes');
    return data;
  },

  getPersonal: async (): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>('/usuarios/personal');
    return data;
  }
};
