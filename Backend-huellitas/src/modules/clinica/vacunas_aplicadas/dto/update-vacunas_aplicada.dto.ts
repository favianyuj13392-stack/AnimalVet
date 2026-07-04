import {
  IsDateString, IsOptional, IsNumber, IsString, MaxLength, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateVacunasAplicadaDto {
  @ApiProperty({ required: false, example: '2027-04-13', description: 'Fecha estimada para la próxima dosis' })
  @IsDateString()
  @IsOptional()
  fecha_proxima_dosis?: string;

  @ApiProperty({ required: false, example: 5.2, description: 'Peso de la mascota al momento de la vacunación (kg)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  peso_mascota_kg?: number;

  @ApiProperty({ required: false, example: 'LOTE-2026-A001', description: 'Número de lote de la vacuna' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  lote_vacuna?: string;
}


