import { IsUUID, IsDateString, IsInt, IsNumber, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCierresCajaDto {
  @ApiProperty({ example: 'uuid-cajero' })
  @IsUUID('all')
  id_cajero_fk: string;

  @ApiProperty({ example: '2026-04-13' })
  @IsDateString()
  fecha_turno: string;

  @ApiProperty({ example: 'Completo', enum: ['Mañana', 'Tarde', 'Noche', 'Completo'] })
  @IsString()
  @IsIn(['Mañana', 'Tarde', 'Noche', 'Completo'])
  turno: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  total_transacciones: number;

  @ApiProperty({ example: 1000.00 })
  @IsNumber()
  total_efectivo: number;

  @ApiProperty({ example: 500.00 })
  @IsNumber()
  total_qr: number;

  @ApiProperty({ example: 300.00 })
  @IsNumber()
  total_tarjeta: number;

  @ApiProperty({ example: 50.00 })
  @IsNumber()
  total_descuentos: number;

  @ApiProperty({ example: 1750.00 })
  @IsNumber()
  total_general: number;

  @ApiProperty({ example: 'Todo OK', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
