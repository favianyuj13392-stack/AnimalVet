import {
  IsString, IsNotEmpty, IsOptional, IsBoolean,
  IsNumber, IsPositive, IsInt, Min, MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductoDto {
  @ApiProperty({ example: 'Amoxicilina 500mg', description: 'Nombre del producto' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @ApiProperty({ required: false, example: 'Antibiótico de amplio espectro' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ required: false, example: 'Cápsula', description: 'Unidad de medida' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  unidad_medida?: string;

  @ApiProperty({ example: false, description: '¿Requiere receta médica para vender?' })
  @IsBoolean()
  @IsOptional()
  requiere_receta?: boolean;

  @ApiProperty({ example: 25.50, description: 'Precio de venta al público' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  precio_venta: number;

  @ApiProperty({ example: 100, description: 'Stock inicial del producto' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock_actual?: number;

  @ApiProperty({ example: 10, description: 'Stock mínimo antes de alerta de reposición' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock_minimo?: number;

  @ApiProperty({ example: 1, description: 'ID de la categoría del producto (FK)' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  id_categoria_fk: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', required: false })
  @IsString()
  @IsOptional()
  imagen_url?: string;
}
