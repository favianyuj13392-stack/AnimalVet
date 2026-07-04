import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Término de búsqueda libre (Ej: nombre, código)', example: 'Fido' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Cantidad de registros a devolver', default: 10 })
  @IsOptional()
  @Type(() => Number) // 👈 Convierte el string de la URL a Número
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Página actual', default: 1 })
  @IsOptional()
  @Type(() => Number) // 👈 Convierte el string de la URL a Número
  @IsInt()
  @Min(1)
  page?: number = 1;
}