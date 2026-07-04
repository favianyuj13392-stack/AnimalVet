import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEspeciesDto {
  @ApiProperty({ example: 'Canino' })
  @IsString()
  nombre_especie: string;
}
