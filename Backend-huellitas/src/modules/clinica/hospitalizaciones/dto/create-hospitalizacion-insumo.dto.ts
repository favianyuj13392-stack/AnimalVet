import { IsUUID, IsInt, IsPositive, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHospitalizacionInsumoDto {
  @ApiProperty({ example: 'uuid-hospitalizacion' })
  @IsUUID('all')
  id_hospitalizacion_fk: string;

  // Obligatorio si no hay servicio
  @ApiProperty({ required: false, example: 'uuid-producto' })
  @ValidateIf(o => !o.id_servicio_fk)
  @IsUUID('all')
  id_producto_fk?: string;

  // Obligatorio si no hay producto
  @ApiProperty({ required: false, example: 1 })
  @ValidateIf(o => !o.id_producto_fk)
  @IsInt()
  @IsPositive()
  id_servicio_fk?: number;

  @ApiProperty({ example: 2, description: 'Cantidad consumida' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiProperty({ required: false, example: 'Aplicado en la mañana' })
  @IsString()
  @IsOptional()
  notas?: string;
}