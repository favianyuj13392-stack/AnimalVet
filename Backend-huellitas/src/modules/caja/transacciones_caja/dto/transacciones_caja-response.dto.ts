import { ApiProperty } from '@nestjs/swagger';

export class TransaccionesCajaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_cajero_fk: string;

  @ApiProperty()
  id_cliente_fk: string;

  @ApiProperty()
  id_historial_fk: string;

  @ApiProperty()
  id_hospitalizacion_fk: string;

  @ApiProperty()
  fecha_transaccion: Date;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  descuento: number;

  @ApiProperty()
  total_cobrado: number;

  @ApiProperty()
  metodo_pago: string;

  @ApiProperty()
  estado_transaccion: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;
}
