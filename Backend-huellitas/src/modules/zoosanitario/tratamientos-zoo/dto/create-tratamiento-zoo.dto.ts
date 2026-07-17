import { IsUUID, IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTratamientoZooDto {
  @ApiProperty({ example: 'uuid-mascota' })
  @IsUUID('all')
  id_mascota_fk: string;

  @ApiProperty({ example: '2026-07-17' })
  @IsDateString()
  fecha: string;

  @ApiProperty({ example: 'Gastroenteritis. Tratado con suero fisiológico.' })
  @IsString()
  descripcion: string;

  @ApiProperty({ required: false, example: 'uuid-veterinario' })
  @IsUUID('all')
  @IsOptional()
  id_veterinario_fk?: string;

  @ApiProperty({ required: false, example: 'uuid-historial' })
  @IsUUID('all')
  @IsOptional()
  id_historial_fk?: string;
}
