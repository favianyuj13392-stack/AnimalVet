import { IsString, IsNotEmpty, MinLength, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEspecieDto {
  @ApiProperty({ example: 'Perro', description: 'Nombre de la especie' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nombre: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  imagen_url?: string;
}