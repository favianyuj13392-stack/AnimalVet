import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateArchivosAdjuntosDto {
  @ApiProperty({ example: 'Analizado', required: false })
  @IsString()
  @IsOptional()
  estado_archivo?: string;

  @ApiProperty({ example: 'Cambio en observaciones', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
