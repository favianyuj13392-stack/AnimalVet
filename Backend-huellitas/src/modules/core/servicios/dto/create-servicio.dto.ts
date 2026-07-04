import { IsString, IsNotEmpty, MaxLength, IsNumber, IsPositive, IsBoolean, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServicioDto {
  @ApiProperty({ example: 'Consulta General', description: 'Nombre del servicio' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del servicio no puede estar vacío' })
  @MaxLength(150)
  nombre: string;

  @ApiProperty({ example: 'Revisión general de rutina', description: 'Descripción opcional', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 100.00, description: 'Precio de venta al público' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número con máximo 2 decimales' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  precio: number;

  @ApiProperty({ example: 30, description: 'Duración estimada en minutos' })
  @IsNumber()
  @IsPositive({ message: 'La duración en minutos debe ser mayor a 0' })
  duracion_minutos: number;

  @ApiProperty({ example: true, description: '¿Requiere un veterinario para realizarse?' })
  @IsBoolean()
  requiere_veterinario: boolean;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  imagen_url?: string;
}