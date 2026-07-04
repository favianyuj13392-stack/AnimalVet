// src/modules/clinica/detalles_receta/dto/create-detalle-receta.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, ValidateIf } from 'class-validator';

export class CreateDetalleRecetaDto {
  @ApiProperty({ required: false, description: 'UUID del producto del catálogo (medicamento)' })
  @IsUUID('all', { message: 'El id_producto debe ser un UUID válido.' })
  @IsOptional()
  id_producto?: string;

  @ApiProperty({ required: false, description: 'Nombre o anotación adicional del medicamento' })
  @IsString()
  @IsOptional()
  medicamento_texto?: string;

  @ApiProperty({ description: 'Dosis (ej: 1 tableta, 5ml)' })
  @IsString()
  dosis: string;

  @ApiProperty({ description: 'Frecuencia (ej: cada 8 horas)' })
  @IsString()
  frecuencia: string;

  @ApiProperty({ required: false, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  duracion_dias?: number;
}