import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRecetasDto {
  @ApiProperty({ example: 'Aplicar tres veces al día', required: false })
  @IsString()
  @IsOptional()
  indicaciones_grales?: string;
}
