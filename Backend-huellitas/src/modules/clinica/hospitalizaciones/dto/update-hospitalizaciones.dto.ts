import { IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHospitalizacionesDto {
  @ApiProperty({ example: 'Estable', required: false })
  @IsString()
  @IsOptional()
  estado_actual?: string;

  @ApiProperty({ example: '2026-04-15', required: false })
  @IsDateString()
  @IsOptional()
  fecha_alta?: string;

  @ApiProperty({ example: 200.00, required: false })
  @IsNumber()
  @IsOptional()
  costo_por_dia?: number;

  @ApiProperty({ example: 'Recuperado', required: false })
  @IsString()
  @IsOptional()
  condicion_egreso?: string;

  @ApiProperty({ example: 'Gastroenteritis resuelta', required: false })
  @IsString()
  @IsOptional()
  diagnostico_egreso?: string;

  @ApiProperty({ example: 'Dieta blanda por 5 días, control en 1 semana', required: false })
  @IsString()
  @IsOptional()
  instrucciones_alta?: string;
}
