import { ApiProperty } from '@nestjs/swagger';

export class DetalleProductoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;
}

export class DetallesRecetaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  medicamento_texto?: string;

  @ApiProperty()
  dosis: string;

  @ApiProperty()
  frecuencia: string;

  @ApiProperty({ required: false })
  duracion_dias?: number;

  @ApiProperty({ type: DetalleProductoResponseDto, required: false })
  producto?: DetalleProductoResponseDto;
}

