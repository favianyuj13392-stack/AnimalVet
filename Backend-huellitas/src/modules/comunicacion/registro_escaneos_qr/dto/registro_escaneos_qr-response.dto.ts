import { ApiProperty } from '@nestjs/swagger';

export class RegistroEscaneoQRResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_mascota_fk: string;

  @ApiProperty()
  latitud: number;

  @ApiProperty()
  longitud: number;

  @ApiProperty()
  user_agent: string;

  @ApiProperty()
  notificacion_enviada: boolean;

  @ApiProperty()
  createdAt: Date;
}
