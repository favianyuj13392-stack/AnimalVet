import { createCrudService } from "@/shared/lib/base.service";
import api from "@/shared/lib/axios";
import { Producto, CreateProductoDto, UpdateProductoDto } from "../inventory.types";

export interface Product {
  id: string;
  nombre: string;
  codigo?: string;
  categoria?: string;
  stock?: number;
  stockMinimo?: number;
  precioCompra?: number;
  precioVenta?: number;
  vencimiento?: string;
  lote?: string;
}

export const productosService = {
  ...createCrudService<Producto>('/productos'),

  create: async (payload: CreateProductoDto): Promise<Producto> => {
    const { data } = await api.post<Producto>('/productos', payload);
    return data;
  },

  update: async (id: string | number, payload: UpdateProductoDto): Promise<Producto> => {
    const { data } = await api.patch<Producto>(`/productos/${id}`, payload);
    return data;
  },

  activar: async (id: string | number): Promise<void> => {
    await api.post(`/productos/${id}/activar`);
  }
};

