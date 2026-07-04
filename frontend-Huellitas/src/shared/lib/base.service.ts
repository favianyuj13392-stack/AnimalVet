import api from './axios';

export const createCrudService = <T>(endpoint: string) => {
  return {
    // Obtener todos
    getAll: async (): Promise<T[]> => {
      const { data } = await api.get<T[]>(endpoint);
      return data;
    },

    // Obtener uno
    getOne: async (id: string | number): Promise<T> => {
      const { data } = await api.get<T>(`${endpoint}/${id}`);
      return data;
    },

    // Crear
    create: async (payload: Partial<T>): Promise<T> => {
      console.log(`Creando en ${endpoint} con payload:`, payload);
      const { data } = await api.post<T>(endpoint, payload);
      
      return data;
    },

    // Actualizar
    update: async (id: string | number, payload: Partial<T>): Promise<T> => {
      const { data } = await api.patch<T>(`${endpoint}/${id}`, payload);
      return data;
    },

    // Eliminar
    delete: async (id: string | number): Promise<void> => {
      await api.delete(`${endpoint}/${id}`);
    }
  };
};