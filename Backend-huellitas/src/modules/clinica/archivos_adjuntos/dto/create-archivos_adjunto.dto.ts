import {
  IsUUID, IsString, IsDateString, IsOptional, IsIn, MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArchivoAdjuntoDto {
  @ApiProperty({ example: 'uuid-historial', description: 'UUID del historial clínico al que pertenece' })
  @IsUUID('all')
  @IsOptional() // 👈 AHORA ES OPCIONAL
  id_historial_fk: string;

  @ApiProperty({ example: 'https://s3.huellitas.com/rx/radiografia.jpg', description: 'URL pública del archivo' })
  @IsString()
  @MaxLength(500)
  url_archivo: string;

  @ApiProperty({ required: false, example: 'uuid-hospitalizacion' })
  @IsUUID('all')
  @IsOptional() // 👈 NUEVO CAMPO OPCIONAL
  id_hospitalizacion_fk?: string;

  @ApiProperty({ required: false, example: 'radiografia_torax.jpg', description: 'Nombre descriptivo del archivo' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  nombre_archivo?: string;

  @ApiProperty({ example: 'image/jpeg', description: 'Tipo MIME del archivo' })
  @IsString()
  @MaxLength(50)
  tipo_archivo: string;

  @ApiProperty({
    example: 'Radiografia',
    enum: ['Radiografia', 'Laboratorio', 'Ecografia', 'Electrocardiograma', 'Otro'],
    description: 'Categoría del estudio',
  })
  @IsIn(['Radiografia', 'Laboratorio', 'Ecografia', 'Electrocardiograma', 'Otro'])
  tipo_estudio: string;

  @ApiProperty({
    example: 'Interno',
    enum: ['Interno', 'Externo'],
    description: '¿Es un estudio interno de la clínica o traído de afuera?',
  })
  @IsIn(['Interno', 'Externo'])
  @IsOptional()
  origen?: string;

  @ApiProperty({
    example: 'Recibido',
    enum: ['Pendiente', 'Recibido', 'Analizado'],
    description: 'Estado del archivo adjunto',
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
