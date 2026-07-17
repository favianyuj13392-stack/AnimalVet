import { ApiProperty } from '@nestjs/swagger';

export class MonitoreoVeterinarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  email: string;
}

export class MonitoreoDiarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_hospitaliza_fk: string;

  @ApiProperty()
  turno: string;

  @ApiProperty({ required: false })
  temperatura_c?: number;

  @ApiProperty({ required: false })
  freq_cardiaca?: number;

  @ApiProperty({ required: false })
  freq_respiratoria?: number;

  @ApiProperty()
  observaciones: string;

  @ApiProperty({ type: MonitoreoVeterinarioResponseDto, required: false })
  veterinario?: MonitoreoVeterinarioResponseDto;

  @ApiProperty({ required: false })
  vomito_diarrea_convulsion?: string;

  @ApiProperty({ required: false })
  presion?: string;

  @ApiProperty({ required: false })
  spo2?: number;

  @ApiProperty({ required: false })
  tllc?: string;

  @ApiProperty({ required: false })
  mucosa?: string;

  @ApiProperty({ required: false })
  peso_kg?: number;

  @ApiProperty({ required: false })
  produccion_orina_ml?: number;

  @ApiProperty({ required: false })
  glasgow?: number;

  @ApiProperty()
  fecha_registro: Date;
}
