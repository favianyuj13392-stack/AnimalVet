import { IsUUID, IsString, IsInt, IsOptional, IsIn, Min, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateKardexInventarioDto {
  @ApiProperty({ example: 'uuid-producto' })
  @IsUUID('all')
  id_producto_fk: string;

  @ApiProperty({ example: 'uuid-usuario' })
  @IsOptional()
  @IsUUID('all')
  id_usuario_fk?: string;

  @ApiProperty({ example: 'Entrada', enum: ['Entrada', 'Salida_Venta', 'Salida_Clinica', 'Merma', 'Ajuste'] })
  @IsString()
  @IsIn(['Entrada', 'Salida_Venta', 'Salida_Clinica', 'Merma', 'Ajuste'])
  tipo_movimiento: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiProperty({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  saldo_resultante?: number;

  @ApiProperty({ example: 'Compra a proveedor', required: false })
  @IsString()
  @IsOptional()
  motivo_detalle?: string;

  @ApiProperty({ example: 'uuid-transaccion', required: false })
  @IsUUID('all')
  @IsOptional()
  id_transaccion_fk?: string;

  @ApiProperty({ example: 'uuid-lote', required: false })
  @IsUUID('all')
  @IsOptional()
  id_lote_fk?: string;

  @ApiProperty({ example: 'uuid-historial', required: false })
  @IsUUID('all')
  @IsOptional()
  id_historial_fk?: string;
}
