import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEspeciesDto {
  @ApiProperty({ example: 'Canino Doméstico', required: false })
  @IsString()
  @IsOptional()
  nombre_especie?: string;
}
