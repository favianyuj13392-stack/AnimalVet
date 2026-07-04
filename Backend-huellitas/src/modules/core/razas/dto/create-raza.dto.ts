import { IsString, IsNotEmpty, MaxLength, IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRazaDto {
  @ApiProperty({ example: 'Pug', description: 'Nombre de la raza' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la raza es obligatorio' })
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ example: 1, description: 'ID de la especie a la que pertenece' })
  @IsInt()
  @IsPositive({ message: 'El ID de la especie debe ser un número positivo' })
  id_especie_fk: number;
}