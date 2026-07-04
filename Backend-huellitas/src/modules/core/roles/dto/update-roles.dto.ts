import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRolesDto {
  @ApiProperty({ example: 'Veterinario Senior', required: false })
  @IsString()
  @IsOptional()
  nombre_rol?: string;

  @ApiProperty({ example: 'Profesional veterinario senior', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;
}
