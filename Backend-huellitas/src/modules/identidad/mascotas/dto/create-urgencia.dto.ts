import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID, IsIn, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUrgenciaDto {
  @ApiPropertyOptional({ example: 'Bobby Desconocido', description: 'Nombre temporal o aproximado' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ example: 'M', description: 'M = Macho, H = Hembra' })
  @IsString()
  @IsOptional()
  @IsIn(['M', 'H'])
  sexo?: string;

  @ApiProperty({ example: 'Canino', description: 'Especie del animal (Canino / Felino)' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Canino', 'Felino'])
  especie_nombre: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre de quien trae la mascota' })
  @IsString()
  @IsNotEmpty()
  contacto_nombre: string;

  @ApiProperty({ example: '987654321', description: 'Teléfono de contacto rápido' })
  @IsString()
  @IsNotEmpty()
  contacto_telefono: string;

  @ApiProperty({ example: 'f2be220f-0bf3-4db0-bb46-4e55e85579f1', description: 'UUID del veterinario asignado para la cita express' })
  @IsUUID('all')
  @IsNotEmpty()
  id_veterinario: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del servicio (ej: 1 = Consulta general)' })
  @IsInt()
  @IsOptional()
  id_servicio?: number;
}
