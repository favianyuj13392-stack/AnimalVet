import { ApiProperty } from '@nestjs/swagger';

export class ArchivosAdjuntosResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_historial_fk?: string;

  @ApiProperty()
  id_hospitalizacion_fk?: string;

  @ApiProperty()
  url_archivo: string;

  @ApiProperty({ required: false })
  nombre_archivo?: string;

  @ApiProperty()
  tipo_archivo: string;

  @ApiProperty()
  tipo_estudio: string;

  @ApiProperty()
  origen: string;

  @ApiProperty()
  estado_archivo: string;

  @ApiProperty({ required: false })
  fecha_estudio?: Date;

  @ApiProperty({ required: false })
  observaciones?: string;
}
