import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCatalogoVacunasDto {
  @ApiProperty({ example: 'Antirrábica Actualizada', required: false })
  @IsString()
  @IsOptional()
  nombre_vacuna?: string;

  @ApiProperty({ example: 'Previene rabia (actualizado)', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: '24 meses', required: false })
  @IsString()
  @IsOptional()
  intervalo_revacunacion?: string;
}
