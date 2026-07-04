import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoriasProductoDto {
  @ApiProperty({ example: 'Alimentos Premium', required: false })
  @IsString()
  @IsOptional()
  nombre_categoria?: string;

  @ApiProperty({ example: 'Alimentos premium para mascotas', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;
}
