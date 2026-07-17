import {
  IsUUID, IsInt, IsPositive, IsDateString, IsOptional,
  IsNumber, IsString, MaxLength, Min, ValidateIf
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVacunasAplicadaDto {
  @ApiProperty({ required: false, example: 'uuid-historial' })
  @IsUUID('all')
  @IsOptional()
  id_historial_fk?: string;

  @ApiProperty({ required: false, example: 'uuid-hospitalizacion' })
  @IsUUID('all')
  @IsOptional()
  id_hospitalizacion_fk?: string;

  @ApiProperty({ required: false, example: 'uuid-mascota' })
  @IsUUID('all')
  @IsOptional()
  id_mascota_fk?: string;

  @ApiProperty({ example: 1, description: 'ID de la vacuna del catálogo' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  id_vacuna_fk: number;

  @ApiProperty({ required: false, example: 'uuid-veterinario' })
  @IsUUID('all')
  @IsOptional()
  id_veterinario_fk?: string;

  @ApiProperty({ required: false, example: '2026-04-13' })
  @IsDateString()
  @IsOptional()
  fecha_aplicacion?: string;

  @ApiProperty({ required: false, example: '2027-04-13' })
  @IsDateString()
  @IsOptional()
  fecha_proxima_dosis?: string;

  @ApiProperty({ required: false, example: 5.2 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  peso_mascota_kg?: number;

  @ApiProperty({ required: false, example: 'LOTE-2026-A001' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  lote_vacuna?: string;
}