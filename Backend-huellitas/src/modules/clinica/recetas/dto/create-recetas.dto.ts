// src/modules/clinica/recetas/dto/create-receta.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetalleRecetaDto } from '../../detalles_receta/dto/create-detalles_receta.dto';

export class CreateRecetaDto {
  @ApiProperty({ description: 'UUID del historial clínico', example: 'uuid-historial' })
  @IsUUID()
  id_historial: string;

  @ApiProperty({ required: false, description: 'UUID del veterinario (opcional, por defecto el del token)' })
  @IsUUID()
  @IsOptional()
  id_veterinario?: string;

  @ApiProperty({ required: false, description: 'Indicaciones generales' })
  @IsString()
  @IsOptional()
  indicaciones_grales?: string;

  @ApiProperty({
    type: [CreateDetalleRecetaDto],
    description: 'Lista de detalles de la receta',
    isArray: true,
    example: [
      {
        id_producto: 'uuid-producto',
        dosis: '1 tableta',
        frecuencia: 'cada 8 horas',
        duracion_dias: 7
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleRecetaDto)
  detalles: CreateDetalleRecetaDto[];
}