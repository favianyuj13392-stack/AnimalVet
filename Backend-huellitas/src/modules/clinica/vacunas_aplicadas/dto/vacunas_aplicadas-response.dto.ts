import { ApiProperty } from '@nestjs/swagger';

export class VacunaDetalleResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  diasParaRefuerzo: number;
}

export class VacunaVeterinarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  email: string;
}

export class VacunasAplicadasResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fecha_aplicacion: Date;

  @ApiProperty({ required: false })
  fecha_proxima_dosis?: Date;

  @ApiProperty({ required: false })
  peso_mascota_kg?: number;

  @ApiProperty({ required: false })
  lote_vacuna?: string;

  @ApiProperty({ type: VacunaDetalleResponseDto, required: false })
  vacuna?: VacunaDetalleResponseDto;

  @ApiProperty({ type: VacunaVeterinarioResponseDto, required: false })
  veterinario?: VacunaVeterinarioResponseDto;
}
