import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCobroClinicoDto {
  @ApiProperty({ example: 'Efectivo', enum: ['Efectivo', 'QR_Transferencia', 'Tarjeta'], description: 'Metodo de pago del cobro clinico.' })
  @IsIn(['Efectivo', 'QR_Transferencia', 'Tarjeta'])
  metodo_pago: string;

  @ApiPropertyOptional({ example: 'Tarde', enum: ['Mañana', 'Tarde', 'Noche'], description: 'Turno de caja para cierre/arqueo.' })
  @IsOptional()
  @IsString()
  @IsIn(['Mañana', 'Tarde', 'Noche'])
  turno?: string;

  @ApiPropertyOptional({ example: 10, description: 'Descuento total aplicado al cobro generado.' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  descuento?: number;

  @ApiPropertyOptional({ example: 2, description: 'Servicio que representa la aplicacion de una vacuna. Si se envia, se agrega una linea tipo_cobro=previo por cada vacuna aplicada.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_servicio_vacunacion_fk?: number;

  @ApiPropertyOptional({ example: 3, description: 'Servicio que representa los dias/costo de hospitalizacion. Requerido para cobrar costo_por_dia como tipo_cobro=previo.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_servicio_hospitalizacion_fk?: number;

  @ApiPropertyOptional({ example: true, description: 'Incluye como linea tipo_cobro=entrega el producto fisico vinculado a la vacuna, sin descontar stock otra vez porque ya fue consumido clinicamente.' })
  @IsOptional()
  @IsBoolean()
  cobrar_producto_vacuna?: boolean;
}
