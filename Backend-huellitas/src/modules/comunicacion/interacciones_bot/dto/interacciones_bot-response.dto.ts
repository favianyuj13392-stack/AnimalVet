import { ApiProperty } from '@nestjs/swagger';

export class InteraccionesBotResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sesion_id: string;

  @ApiProperty()
  numero_whatsapp: string;

  @ApiProperty()
  mensaje_usuario: string;

  @ApiProperty()
  intencion_detectada: string;

  @ApiProperty()
  respuesta_bot: string;

  @ApiProperty()
  id_cliente_fk: string;

  @ApiProperty()
  id_cita_generada_fk: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
