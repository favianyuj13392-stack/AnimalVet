import { IsString, IsInt, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProgramaSanitarioItemDto {
  @ApiProperty({ example: 'Canino', description: 'Canino o Felino' })
  @IsString()
  @MaxLength(20)
  especie: string;

  @ApiProperty({ example: '6-8 semanas' })
  @IsString()
  @MaxLength(100)
  edad_texto: string;

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

  @ApiProperty({ example: 'Vacuna Parvovirus + Moquillo' })
  @IsString()
  detalle: string;

  @ApiProperty({ required: false, example: 'Obligatoria primera dosis' })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({ required: false, example: 0 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  orden?: number;
}
