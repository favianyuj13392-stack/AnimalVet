import { IsUUID, IsDateString, IsString, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDesparasitacionDto {
  @ApiProperty({ example: 'uuid-mascota' })
  @IsUUID('all')
  id_mascota_fk: string;

  @ApiProperty({ example: '2026-07-17' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 'Drontal Plus' })
  @IsString()
  @MaxLength(200)
  producto_utilizado: string;

  @ApiProperty({ required: false, example: 'uuid-producto' })
  @IsUUID('all')
  @IsOptional()
  id_producto_fk?: string;

  @ApiProperty({ required: false, example: 12.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  peso_kg?: number;

  @ApiProperty({ required: false, example: '2026-10-17' })
  @IsDateString()
  @IsOptional()
  fecha_proxima?: string;

  @ApiProperty({ required: false, example: 'uuid-veterinario' })
  @IsUUID('all')
  @IsOptional()
  id_veterinario_fk?: string;

  @ApiProperty({ required: false, example: 'uuid-historial' })
  @IsUUID('all')
  @IsOptional()
  id_historial_fk?: string;

  @ApiProperty({ required: false, example: 'Dosis preventiva regular' })
  @IsString()
  @IsOptional()
  notas?: string;
}
