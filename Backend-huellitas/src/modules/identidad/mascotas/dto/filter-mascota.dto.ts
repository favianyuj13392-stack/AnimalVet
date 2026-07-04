import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../../compartido/dto/pagination.dto'; // 👈 Ajusta la ruta según tu proyecto

export class FilterMascotaDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por estado de extravío', example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true') // 👈 Transforma el string 'true' de la URL a booleano
  estado_perdido?: boolean;

  @ApiPropertyOptional({ description: 'ID del dueño para ver solo sus mascotas' })
  @IsOptional()
  @IsUUID()
  id_dueno_fk?: string;

  @ApiPropertyOptional({ description: 'Sexo de la mascota (M/H)' })
  @IsOptional()
  @IsString()
  sexo?: string;
}