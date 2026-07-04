import { IsUUID, IsInt, IsDateString, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVacunasAplicadasDto {
  @ApiProperty({ example: 'uuid-historial' })
  @IsUUID('all')
  id_historial_fk: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  id_vacuna_fk: number;

  @ApiProperty({ example: 'uuid-veterinario', required: false })
  @IsUUID('all')
  @IsOptional()
  id_veterinario_fk?: string;

  @ApiProperty({ example: '2026-04-13' })
  @IsDateString()
  fecha_aplicacion: string;

  @ApiProperty({ example: '2027-04-13', required: false })
  @IsDateString()
  @IsOptional()
  fecha_proxima_dosis?: string;

  @ApiProperty({ example: 12.5, required: false })
  @IsNumber()
  @IsOptional()
  peso_mascota_kg?: number;

  @ApiProperty({ example: 'LOTE123456', required: false })
  @IsString()
  @IsOptional()
  lote_vacuna?: string;
}
