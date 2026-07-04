import { IsString, IsOptional, IsNumber, IsInt, IsIn, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateMonitoreoDiarioDto {
  @ApiProperty({
    example: 'Mañana',
    enum: ['Mañana', 'Tarde', 'Noche'],
    description: 'Turno en que se realiza el monitoreo',
    required: false,
  })
  @IsIn(['Mañana', 'Tarde', 'Noche'])
  @IsOptional()
  turno?: string;

  @ApiProperty({ required: false, example: 38.5, description: 'Temperatura de la mascota en grados Celsius' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(50)
  @IsOptional()
  @Type(() => Number)
  temperatura_c?: number;

  @ApiProperty({ required: false, example: 120, description: 'Frecuencia cardíaca (latidos por minuto)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  freq_cardiaca?: number;

  @ApiProperty({ required: false, example: 30, description: 'Frecuencia respiratoria (respiraciones por minuto)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  freq_respiratoria?: number;

  @ApiProperty({ required: false, example: 'El paciente se encuentra estable, consumió alimento húmedo y agua.', description: 'Observaciones del estado' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

