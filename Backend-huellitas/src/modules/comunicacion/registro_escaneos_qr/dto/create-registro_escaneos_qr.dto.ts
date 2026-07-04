import { IsUUID, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegistroEscaneoQRDto {
  @ApiProperty({ example: 'uuid-mascota' })
  @IsUUID('all')
  id_mascota_fk: string;

  @ApiProperty({ example: -12.0462, required: false })
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @ApiProperty({ example: -77.0372, required: false })
  @IsNumber()
  @IsOptional()
  longitud?: number;

  @ApiProperty({ example: 'Mozilla/5.0...', required: false })
  @IsString()
  @IsOptional()
  user_agent?: string;
}
