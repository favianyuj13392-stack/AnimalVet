import { ApiProperty } from '@nestjs/swagger';

export class DetallesTransaccionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_transaccion_fk: string;

  @ApiProperty()
  id_producto_fk: string;

  @ApiProperty()
  id_servicio_fk: number;

  @ApiProperty()
  id_receta_fk: string;

  @ApiProperty()
  cantidad: number;

  @ApiProperty()
  precio_unitario: number;

  @ApiProperty()
  subtotal_linea: number;

  @ApiProperty()
  tipo_cobro: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;
}
