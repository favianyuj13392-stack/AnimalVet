import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConfiguracionClinicaDto {
  @ApiProperty({ example: 'descuento_maximo_porcentaje' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  clave: string;

  @ApiProperty({ example: '20' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  valor: string;

  @ApiProperty({ example: 'Porcentaje máximo de descuento', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;
}
