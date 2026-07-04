import { ApiProperty } from '@nestjs/swagger';

export class KardexInventarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_producto_fk: string;

  @ApiProperty()
  id_usuario_fk: string;

  @ApiProperty()
  tipo_movimiento: string;

  @ApiProperty()
  cantidad: number;

  @ApiProperty()
  saldo_resultante: number;

  @ApiProperty()
  motivo_detalle: string;

  @ApiProperty()
  id_transaccion_fk: string;

  @ApiProperty()
  id_historial_fk: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  createdBy: string;
}
