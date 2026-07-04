import { IsString, IsDateString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateArchivosAdjuntoDto {
  @ApiProperty({ required: false, example: 'radiografia_torax.jpg', description: 'Nombre descriptivo del archivo' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  nombre_archivo?: string;

  @ApiProperty({
    example: 'Radiografia',
    enum: ['Radiografia', 'Laboratorio', 'Ecografia', 'Electrocardiograma', 'Otro'],
    description: 'Categoría del estudio',
    required: false,
  })
  @IsIn(['Radiografia', 'Laboratorio', 'Ecografia', 'Electrocardiograma', 'Otro'])
  @IsOptional()
  tipo_estudio?: string;

  @ApiProperty({
    example: 'Interno',
    enum: ['Interno', 'Externo'],
    description: '¿Es un estudio interno de la clínica o traído de afuera?',
    required: false,
  })
  @IsIn(['Interno', 'Externo'])
  @IsOptional()
  origen?: string;

  @ApiProperty({
    example: 'Recibido',
    enum: ['Pendiente', 'Recibido', 'Analizado'],
    description: 'Estado del archivo adjunto',
    required: false,
  })
  @IsIn(['Pendiente', 'Recibido', 'Analizado'])
  @IsOptional()
  estado_archivo?: string;

  @ApiProperty({ required: false, example: '2026-04-13', description: 'Fecha del estudio (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  fecha_estudio?: string;

  @ApiProperty({ required: false, example: 'Lesión visible en costilla 5 derecha' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

