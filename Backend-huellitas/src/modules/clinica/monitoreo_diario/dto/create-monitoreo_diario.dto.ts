import {
  IsUUID, IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, IsIn, Min, Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateMonitoreoDiarioDto {
  @ApiProperty({ example: 'uuid-hospitalizacion', description: 'UUID de la hospitalización vinculada' })
  @IsUUID('all')
  @IsNotEmpty()
  id_hospitaliza_fk: string;

  @ApiProperty({ example: 'uuid-veterinario', description: 'UUID del veterinario que realiza el monitoreo' })
  @IsUUID('all')
  @IsNotEmpty()
  id_veterinario_fk: string;

  @ApiProperty({
    example: 'Mañana',
    enum: ['Mañana', 'Tarde', 'Noche'],
    description: 'Turno en que se realiza el monitoreo',
    default: 'Mañana',
  })
  @IsIn(['Mañana', 'Tarde', 'Noche'])
  turno: string;

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

  @ApiProperty({ example: 'El paciente se encuentra estable, consumió alimento húmedo y agua.', description: 'Observaciones del estado' })
  @IsString()
  @IsNotEmpty()
  observaciones: string;

  @IsString()
  @IsOptional()
  vomito_diarrea_convulsion?: string;

  @IsString()
  @IsOptional()
  presion?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  spo2?: number;

  @IsString()
  @IsOptional()
  tllc?: string;

  @IsString()
  @IsOptional()
  mucosa?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  peso_kg?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  produccion_orina_ml?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  glasgow?: number;
}
