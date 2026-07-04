import { ApiProperty } from '@nestjs/swagger';

export class HorarioVeterinarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  email: string;
}

export class HorariosAtencionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dia_semana: number;

  @ApiProperty()
  hora_inicio: string;

  @ApiProperty()
  hora_fin: string;

  @ApiProperty()
  activo: boolean;

  @ApiProperty({ type: HorarioVeterinarioResponseDto, required: false })
  veterinario?: HorarioVeterinarioResponseDto;
}
