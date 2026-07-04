import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConfiguracionClinicaDto {
  @ApiProperty({ example: '25', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  valor?: string;

  @ApiProperty({ example: 'Actualizado', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;
}
