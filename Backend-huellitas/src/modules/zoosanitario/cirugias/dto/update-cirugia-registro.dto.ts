import { IsDateString, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCirugiaRegistroDto {
  @ApiProperty({ required: false, example: '2026-07-17' })
  @IsDateString()
  @IsOptional()
  fecha?: string;

  @ApiProperty({ required: false, example: 'Esterilización' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  tipo_cirugia?: string;

  @ApiProperty({ required: false, example: 'Actualización sobre la recuperación.' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
