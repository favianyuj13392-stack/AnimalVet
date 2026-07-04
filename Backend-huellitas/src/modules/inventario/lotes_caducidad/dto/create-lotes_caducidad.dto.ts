import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class CreateLotesCaducidadDto {
  @ApiProperty({ example: 'uuid-producto' })
  @IsUUID('all')
  id_producto_fk: string;

  @ApiProperty({ example: 'LOTE-AMOX-001' })
  @IsString()
  @IsNotEmpty()
  numero_lote: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  fecha_vencimiento: string;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad_inicial: number;
}
