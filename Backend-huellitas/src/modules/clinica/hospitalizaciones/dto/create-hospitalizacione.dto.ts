import {
  IsUUID, IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsPositive, IsIn, MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateHospitalizacioneDto {
  @ApiProperty({ example: 'uuid-historial', description: 'UUID del historial clínico' })
  @IsUUID('all')
  @IsNotEmpty()
  id_historial_fk: string;

  @ApiProperty({ example: 'uuid-mascota', description: 'UUID de la mascota' })
  @IsUUID('all')
  @IsNotEmpty()
  id_mascota_fk: string;

  @ApiProperty({ example: 'uuid-veterinario', description: 'UUID del veterinario responsable' })
  @IsUUID('all')
  @IsNotEmpty()
  id_veterinario_responsable: string;

  @ApiProperty({ example: '2026-05-21T10:00:00Z', description: 'Fecha y hora de ingreso' })
  @IsDateString()
  @IsNotEmpty()
  fecha_ingreso: string;

  @ApiProperty({ required: false, example: '2026-05-25T18:00:00Z', description: 'Fecha y hora de alta' })
  @IsDateString()
  @IsOptional()
  fecha_alta?: string;

  @ApiProperty({ example: 'Paciente ingresa por deshidratación severa y fiebre', description: 'Motivo del ingreso' })
  @IsString()
  @IsNotEmpty()
  motivo_ingreso: string;

  @ApiProperty({
    example: 'Observacion',
    enum: ['Observacion', 'Estable', 'Grave', 'Alta'],
    description: 'Estado actual de la hospitalización',
    default: 'Observacion',
  })
  @IsIn(['Observacion', 'Estable', 'Grave', 'Alta'])
  @IsOptional()
  estado_actual?: string;

  @ApiProperty({ example: 150.00, description: 'Costo de hospitalización por día' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  costo_por_dia?: number;

  @IsString()
  @IsOptional()
  articulos_ingreso?: string;

  @IsString()
  @IsOptional()
  medicion_post_operatoria?: string;
}
