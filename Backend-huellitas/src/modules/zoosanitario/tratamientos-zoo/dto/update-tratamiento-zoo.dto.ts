import { IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTratamientoZooDto {
  @ApiProperty({ required: false, example: '2026-07-17' })
  @IsDateString()
  @IsOptional()
  fecha?: string;

  @ApiProperty({ required: false, example: 'Persisten síntomas de gastroenteritis.' })
  @IsString()
  @IsOptional()
  descripcion?: string;
}
