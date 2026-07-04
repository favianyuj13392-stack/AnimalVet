import { IsUUID, IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArchivosAdjuntosDto {
  @ApiProperty({ example: 'uuid-historial' })
  @IsUUID('all')
  id_historial_fk: string;

  @ApiProperty({ example: 'https://s3.ejemplo.com/radiografia.jpg' })
  @IsString()
  url_archivo: string;

  @ApiProperty({ example: 'radiografia_pecho.jpg', required: false })
  @IsString()
  @IsOptional()
  nombre_archivo?: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  tipo_archivo: string;

  @ApiProperty({ example: 'Radiografia' })
  @IsString()
  tipo_estudio: string;

  @ApiProperty({ example: 'Interno' })
  @IsString()
  origen: string;

  @ApiProperty({ example: 'Recibido' })
  @IsString()
  estado_archivo: string;

  @ApiProperty({ example: '2026-04-13', required: false })
  @IsDateString()
  @IsOptional()
  fecha_estudio?: string;

  @ApiProperty({ example: 'Ver lesión en costilla derecha', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
