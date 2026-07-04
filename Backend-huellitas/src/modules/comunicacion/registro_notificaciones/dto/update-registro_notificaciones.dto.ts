import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRegistroNotificacionesDto {
  @ApiProperty({ example: 'Enviado', enum: ['Pendiente', 'Enviado', 'Error'], required: false })
  @IsString()
  @IsIn(['Pendiente', 'Enviado', 'Error'])
  @IsOptional()
  estado_envio?: string;
}
