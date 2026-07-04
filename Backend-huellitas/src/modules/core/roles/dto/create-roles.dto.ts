import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolesDto {
  @ApiProperty({ example: 'Veterinario' })
  @IsString()
  nombre_rol: string;

  @ApiProperty({ example: 'Profesional veterinario de la clínica' })
  @IsString()
  descripcion: string;
}
