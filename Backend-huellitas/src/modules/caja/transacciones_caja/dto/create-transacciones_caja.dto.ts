import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateDetalleVentaProductoDto {
  @ApiPropertyOptional({ example: 'uuid-producto', description: 'UUID del producto vendido en mostrador. Requerido si no se envía id_servicio_fk.' })
  @IsOptional()
  @IsString()
  id_producto_fk?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID numérico del servicio vendido. Requerido si no se envía id_producto_fk. No descuenta stock.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  id_servicio_fk?: number;

  @ApiPropertyOptional({ example: 'uuid-lote', description: 'Lote especifico a consumir. Si no se envia, el backend usa FIFO por vencimiento.' })
  @IsOptional()
  @IsString()
  id_lote_fk?: string;

  @ApiProperty({ example: 2, description: 'Cantidad vendida o cobrada.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional({ example: 25.5, description: 'Precio unitario manual. Si no se envia, se toma del producto o servicio.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio_unitario?: number;
}

export class CreateDetalleVentaDto extends CreateDetalleVentaProductoDto {}

export class CreateTransaccionesCajaDto {
  @ApiPropertyOptional({ example: 'uuid-cliente', description: 'Cliente/dueño asociado al cobro.' })
  @IsOptional()
  @IsString()
  id_cliente_fk?: string;

  @ApiProperty({ example: 'Efectivo', enum: ['Efectivo', 'QR_Transferencia', 'Tarjeta'], description: 'Metodo de pago del cobro.' })
  @IsIn(['Efectivo', 'QR_Transferencia', 'Tarjeta'])
  metodo_pago: string;

  @ApiPropertyOptional({ example: 'Tarde', enum: ['Mañana', 'Tarde', 'Noche'], description: 'Turno de caja para cierre/arqueo.' })
  @IsOptional()
  @IsIn(['Mañana', 'Tarde', 'Noche'])
  turno?: string;

  @ApiPropertyOptional({ example: 10, description: 'Descuento total aplicado a la transaccion.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  descuento?: number;

  @ApiProperty({
    type: [CreateDetalleVentaProductoDto],
    description: 'Lineas de venta directa. Solo productos de mostrador. El backend registra estos detalles como tipo_cobro=entrega; servicios, vacunas y hospitalizacion se cobran desde endpoints clinicos como tipo_cobro=previo.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaProductoDto)
  detalles: CreateDetalleVentaProductoDto[];
}
