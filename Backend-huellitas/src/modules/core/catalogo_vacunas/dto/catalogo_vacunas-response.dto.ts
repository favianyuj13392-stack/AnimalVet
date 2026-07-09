import { ApiProperty } from '@nestjs/swagger';



export class CatalogoVacunasResponseDto {
  id: string;
  nombre_vacuna: string;
  descripcion: string | null;
  intervalo_revacunacion: string;
  id_especie_fk: number;
  id_producto_fk?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  producto?: {
    id: string;
    nombre: string;
    precio_venta: number;
    stock_actual: number;
  };
  especie?: {
    id: number;
    nombre: string;
  };
}