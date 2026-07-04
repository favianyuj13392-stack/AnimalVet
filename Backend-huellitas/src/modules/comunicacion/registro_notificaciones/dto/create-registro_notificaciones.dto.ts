import { IsString, IsUUID, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegistroNotificacionesDto {
  @ApiProperty({ example: 'Recordatorio de cita' })
  @IsString()
  tipo_notificacion: string;

  @ApiProperty({ example: 'WhatsApp', enum: ['WhatsApp', 'Email', 'SMS'] })
  @IsString()
  @IsIn(['WhatsApp', 'Email', 'SMS'])
  canal_envio: string;

  @ApiProperty({ example: 'Recordatorio: Tu cita es mañana a las 10:00' })
  @IsString()
  cuerpo_mensaje: string;

  @ApiProperty({ example: 'Pendiente', enum: ['Pendiente', 'Enviado', 'Error'] })
  @IsString()
  @IsIn(['Pendiente', 'Enviado', 'Error'])
  estado_envio: string;

  @ApiProperty({ example: 'uuid-usuario', required: false })
  @IsUUID('all')
  @IsOptional()
  id_usuario_fk?: string;

  @ApiProperty({ example: 'uuid-cita', required: false })
  @IsUUID('all')
  @IsOptional()
  id_cita_fk?: string;

  @ApiProperty({ example: 'uuid-mascota', required: false })
  @IsUUID('all')
  @IsOptional()
  id_mascota_fk?: string;
}
