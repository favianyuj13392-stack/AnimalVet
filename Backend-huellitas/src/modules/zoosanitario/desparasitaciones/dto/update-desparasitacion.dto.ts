import { IsDateString, IsString, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateDesparasitacionDto {
  @ApiProperty({ required: false, example: '2026-07-17' })
  @IsDateString()
  @IsOptional()
  fecha?: string;

  @ApiProperty({ required: false, example: 'Drontal Plus' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  producto_utilizado?: string;

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

  @ApiProperty({ required: false, example: 'Dosis preventiva modificada' })
  @IsString()
  @IsOptional()
  notas?: string;
}
