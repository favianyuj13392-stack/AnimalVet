export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string | null;
  unidadMedida: string;
  requiereReceta: boolean;
  precioVenta: number;
  stockActual: number;
  stockMinimo: number;
  id_categoria_fk: number;
  categoria?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateProductoDto {
  nombre: string;
  descripcion?: string;
  unidad_medida: string;
  requiere_receta: boolean;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  id_categoria_fk: number;
}

export interface UpdateProductoDto {
  nombre?: string;
  descripcion?: string;
  unidad_medida?: string;
  requiere_receta?: boolean;
  precio_venta?: number;
  stock_actual?: number;
  stock_minimo?: number;
  id_categoria_fk?: number;
}

