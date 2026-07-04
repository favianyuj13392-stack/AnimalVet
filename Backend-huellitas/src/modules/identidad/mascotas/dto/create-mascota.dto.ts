import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID, IsInt, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMascotaDto {
  @ApiProperty({ example: 'Pardo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: '2020-05-15', required: false })
  @IsOptional()
  @IsString()
  fecha_nacimiento?: string; // Lo dejamos como string para que NestJS lo procese fácil

  @ApiProperty({ example: 'M', description: 'M = Macho, H = Hembra' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['M', 'H'])
  sexo: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  esterilizado?: boolean;

  @ApiProperty({ example: 'c3cafbb3-ed26-4977-9ab9-435dd731c84b', description: 'UUID del Cliente (Dueño)' })
  @IsUUID()
  @IsOptional() // Opcional por si llega un perrito de la calle en emergencia
  id_dueno_fk?: string;

  @ApiProperty({ example: 1, description: 'ID de la Raza (Ej: 1 = Beagle)' })
  @IsInt()
  @IsOptional()
  id_raza_fk?: number;

  @ApiProperty({ example: 'https://storage.huellitas.net/fotos/luna.jpg', required: false })
  @IsString()
  @IsOptional()
  foto_url?: string;

  @ApiProperty({ example: 'Pelaje dorado, collar rojo, mancha blanca en el pecho', required: false })
  @IsString()
  @IsOptional()
  caracteristicas_fisicas?: string;

  @ApiProperty({ example: '70012345', required: false })
  @IsString()
  @IsOptional()
  contacto_emergencia_telefono?: string;
}