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

  @ApiProperty()
  fecha_registro: Date;
}
