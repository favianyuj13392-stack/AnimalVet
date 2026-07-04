import { ApiProperty } from '@nestjs/swagger';

export class CierresCajaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_cajero_fk: string;

  @ApiProperty()
  fecha_turno: Date;

  @ApiProperty()
  turno: string;

  @ApiProperty()
  total_transacciones: number;

  @ApiProperty()
  total_efectivo: number;

  @ApiProperty()
  total_qr: number;

  @ApiProperty()
  total_tarjeta: number;

  @ApiProperty()
  total_descuentos: number;

  @ApiProperty()
  total_general: number;

  @ApiProperty()
  cerrado_en: Date;

  @ApiProperty()
  observaciones: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  createdBy: string;
}
