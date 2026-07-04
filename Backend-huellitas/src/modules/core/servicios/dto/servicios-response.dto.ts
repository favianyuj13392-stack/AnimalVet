import { ApiProperty } from '@nestjs/swagger';

export class ServiciosResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre_servicio: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  precio_base: number;

  @ApiProperty()
  duracion_estimada_minutos: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
