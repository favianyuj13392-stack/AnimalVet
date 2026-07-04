import { IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiciosDto {
  @ApiProperty({ example: 'Consulta General' })
  @IsString()
  nombre_servicio: string;

  @ApiProperty({ example: 'Consulta veterinaria general' })
  @IsString()
  descripcion: string;

  @ApiProperty({ example: 50.00 })
  @IsInt()
  precio_base: number;

  @ApiProperty({ example: '30' })
  @IsString()
  duracion_estimada_minutos: string;
}
