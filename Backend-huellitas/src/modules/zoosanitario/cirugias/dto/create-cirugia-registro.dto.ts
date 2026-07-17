import { IsUUID, IsDateString, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCirugiaRegistroDto {
  @ApiProperty({ example: 'uuid-mascota' })
  @IsUUID('all')
  id_mascota_fk: string;

  @ApiProperty({ example: '2026-07-17' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 'Esterilización' })
  @IsString()
  @MaxLength(200)
  tipo_cirugia: string;

  @ApiProperty({ required: false, example: 'Cirugía sin complicaciones, recuperación normal.' })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({ required: false, example: 'uuid-veterinario' })
  @IsUUID('all')
  @IsOptional()
  id_veterinario_fk?: string;

  @ApiProperty({ required: false, example: 'uuid-historial' })
  @IsUUID('all')
  @IsOptional()
  id_historial_fk?: string;
}
