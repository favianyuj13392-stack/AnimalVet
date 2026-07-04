import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRazasDto {
  @ApiProperty({ example: 'Golden Retriever Actualizado', required: false })
  @IsString()
  @IsOptional()
  nombre_raza?: string;
}
