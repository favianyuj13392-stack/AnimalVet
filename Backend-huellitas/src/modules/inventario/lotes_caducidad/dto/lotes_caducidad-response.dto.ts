import { ApiProperty } from '@nestjs/swagger';

export class LotesCaducidadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_producto_fk: string;

  @ApiProperty()
  numero_lote: string;

  @ApiProperty()
  fecha_vencimiento: Date;

  @ApiProperty()
  cantidad_inicial: number;

  @ApiProperty()
  cantidad_actual: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;
}
