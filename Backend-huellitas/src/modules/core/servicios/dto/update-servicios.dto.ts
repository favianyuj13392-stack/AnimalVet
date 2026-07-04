import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiciosDto {
  @ApiProperty({ example: 'Consulta General Actualizada', required: false })
  @IsString()
  @IsOptional()
  nombre_servicio?: string;

  @ApiProperty({ example: 'Consulta veterinaria general actualizada', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 60.00, required: false })
  @IsInt()
  @IsOptional()
  precio_base?: number;

  @ApiProperty({ example: '45', required: false })
  @IsString()
  @IsOptional()
  duracion_estimada_minutos?: string;
}
