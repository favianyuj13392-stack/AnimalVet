import { ApiProperty } from '@nestjs/swagger';

export class RegistroNotificacionesResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tipo_notificacion: string;

  @ApiProperty()
  canal_envio: string;

  @ApiProperty()
  cuerpo_mensaje: string;

  @ApiProperty()
  estado_envio: string;

  @ApiProperty()
  id_usuario_fk: string;

  @ApiProperty()
  id_cita_fk: string;

  @ApiProperty()
  id_mascota_fk: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
