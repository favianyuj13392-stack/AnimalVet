import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatalogoVacunasDto {
  @ApiProperty({ example: 'Antirrábica' })
  @IsString()
  nombre_vacuna: string;

  @ApiProperty({ example: 'Previene rabia' })
  @IsString()
  descripcion: string;

  @ApiProperty({ example: '12 meses' })
  @IsString()
  intervalo_revacunacion: string;
}
