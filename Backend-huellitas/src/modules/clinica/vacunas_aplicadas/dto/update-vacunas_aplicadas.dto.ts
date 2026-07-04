import { IsDateString, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVacunasAplicadasDto {
  @ApiProperty({ example: '2027-04-13', required: false })
  @IsDateString()
  @IsOptional()
  fecha_proxima_dosis?: string;

  @ApiProperty({ example: 13.0, required: false })
  @IsNumber()
  @IsOptional()
  peso_mascota_kg?: number;

  @ApiProperty({ example: 'LOTE789012', required: false })
  @IsString()
  @IsOptional()
  lote_vacuna?: string;
}
