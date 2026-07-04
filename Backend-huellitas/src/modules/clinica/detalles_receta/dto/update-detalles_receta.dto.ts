// src/modules/clinica/detalles_receta/dto/update-detalle-receta.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateDetalleRecetaDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  dosis?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  frecuencia?: string;

  @ApiProperty({ required: false, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  duracion_dias?: number;
}