import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoriaProductoDto {
  @ApiProperty({ example: 'Medicamentos', description: 'Nombre de la categoría' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 'Antibióticos, analgésicos y jarabes', description: 'Descripción de la categoría', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;
}