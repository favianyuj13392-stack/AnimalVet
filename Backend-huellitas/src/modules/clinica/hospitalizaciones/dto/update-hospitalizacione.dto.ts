import { IsOptional, IsDateString, IsIn, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHospitalizacioneDto {
  @ApiProperty({ required: false, example: 'Observacion', enum: ['Observacion', 'Estable', 'Grave', 'Alta'] })
  @IsIn(['Observacion', 'Estable', 'Grave', 'Alta'])
  @IsOptional()
  estado_actual?: string;

  @ApiProperty({ required: false, example: '2026-05-25T18:00:00Z' })
  @IsDateString()
  @IsOptional()
  fecha_alta?: string;

  @ApiProperty({ required: false, example: 200.00 })
  @IsNumber()
  @IsOptional()
  costo_por_dia?: number;

  @ApiProperty({ required: false, example: 'Recuperado' })
  @IsString()
  @IsOptional()
  condicion_egreso?: string;

  @ApiProperty({ required: false, example: 'Gastroenteritis resuelta' })
  @IsString()
  @IsOptional()
  diagnostico_egreso?: string;

  @ApiProperty({ required: false, example: 'Dieta blanda por 5 días' })
  @IsString()
  @IsOptional()
  instrucciones_alta?: string;

  @IsString()
  @IsOptional()
  articulos_ingreso?: string;

  @IsString()
  @IsOptional()
  medicion_post_operatoria?: string;
}


