import { ApiProperty } from '@nestjs/swagger';



export class CatalogoVacunasResponseDto {
  id: string;
  nombre_vacuna: string;
  descripcion: string | null;
  intervalo_revacunacion: string;
  id_especie_fk: number; // 👈 Agregar
  createdAt: Date;
  updatedAt: Date;
  producto?: {
    id: string;
    nombre: string;
    precio_venta: number;
    stock_actual: number;
  };
  especie?: {            // 👈 Agregar
    id: number;
    nombre: string;
  };
}