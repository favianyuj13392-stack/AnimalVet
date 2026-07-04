import { PartialType } from '@nestjs/swagger';
import { CreateMascotaDto } from './create-mascota.dto';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMascotaDto extends PartialType(CreateMascotaDto) {

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  estado_perdido?: boolean;

  @ApiProperty({ example: 'Clínica Huellitas', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  punto_entrega_nombre?: string;

  @ApiProperty({ example: 'Av. Arce 1234', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  punto_entrega_direccion?: string;

  @ApiProperty({ example: 'Frente al parque', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  punto_entrega_referencia?: string;

  @ApiProperty({ example: -16.5, required: false })
  @IsNumber()
  @IsOptional()
  punto_entrega_lat?: number;

  @ApiProperty({ example: -68.1, required: false })
  @IsNumber()
  @IsOptional()
  punto_entrega_lng?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  recompensa?: boolean;

  @ApiProperty({ example: 'Necesita medicación diaria', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  mensaje_encontrador?: string;
}
