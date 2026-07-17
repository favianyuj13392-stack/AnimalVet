import { IsString, IsInt, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateProgramaSanitarioItemDto {
  @ApiProperty({ required: false, example: 'Canino' })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  especie?: string;

  @ApiProperty({ required: false, example: '6-8 semanas' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  edad_texto?: string;

  @ApiProperty({ required: false, example: 42 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  edad_dias_desde?: number;

  @ApiProperty({ required: false, example: 56 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  edad_dias_hasta?: number;

  @ApiProperty({ required: false, example: 'Vacuna Parvovirus + Moquillo' })
  @IsString()
  @IsOptional()
  detalle?: string;

  @ApiProperty({ required: false, example: 'Obligatoria primera dosis' })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({ required: false, example: 0 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  orden?: number;

  @ApiProperty({ required: false, example: true })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
