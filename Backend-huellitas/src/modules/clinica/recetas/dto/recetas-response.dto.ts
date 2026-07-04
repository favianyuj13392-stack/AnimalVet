import { ApiProperty } from '@nestjs/swagger';

export class RecetaDetalleProductoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;
}

export class RecetaDetalleResponseDto {
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

  @ApiProperty({ type: RecetaDetalleProductoResponseDto, required: false })
  producto?: RecetaDetalleProductoResponseDto;
}

export class RecetaVeterinarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  numero_matricula?: string | null;
}

export class RecetasResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_historial_fk: string;

  @ApiProperty()
  indicaciones_grales: string;

  @ApiProperty({ type: RecetaVeterinarioResponseDto, required: false })
  veterinario?: RecetaVeterinarioResponseDto;

  @ApiProperty({ type: [RecetaDetalleResponseDto] })
  detalles: RecetaDetalleResponseDto[];
}
