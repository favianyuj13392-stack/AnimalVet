// src/modules/clinica/recetas/dto/update-receta.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateRecetaDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  indicaciones_grales?: string;
}