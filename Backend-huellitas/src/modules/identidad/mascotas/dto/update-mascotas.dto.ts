import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateMascotasDto {
  @ApiProperty({ example: 'Firulais', required: false })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiProperty({ example: 'https://storage.huellitas.net/fotos/luna.jpg', required: false })
  @IsString()
  @IsOptional()
  foto_url?: string;

  @ApiProperty({ example: 'Pelaje dorado, collar rojo, mancha blanca en el pecho', required: false })
  @IsString()
  @IsOptional()
  caracteristicas_fisicas?: string;

  @ApiProperty({ example: '70012345', required: false })
  @IsString()
  @IsOptional()
  contacto_emergencia_telefono?: string;

  // ── Estado perdido + punto de entrega ──────────────────────────────────────

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  estado_perdido?: boolean;

  @ApiProperty({ example: 'Clínica Huellitas Digitales', required: false })
  @IsString()
  @IsOptional()
  punto_entrega_nombre?: string;

  @ApiProperty({ example: 'Av. Arce 1234, Sopocachi, La Paz', required: false })
  @IsString()
  @IsOptional()
  punto_entrega_direccion?: string;

  @ApiProperty({ example: 'Frente al parque, portón azul', required: false })
  @IsString()
  @IsOptional()
  punto_entrega_referencia?: string;

  @ApiProperty({ example: -16.5093, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  punto_entrega_lat?: number;

  @ApiProperty({ example: -68.1282, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  punto_entrega_lng?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  recompensa?: boolean;

  @ApiProperty({ example: 'Mi perrita necesita medicación diaria, por favor llámame', required: false })
  @IsString()
  @IsOptional()
  mensaje_encontrador?: string;
}
