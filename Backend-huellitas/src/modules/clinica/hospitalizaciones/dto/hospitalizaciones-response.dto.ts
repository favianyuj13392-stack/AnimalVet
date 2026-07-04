import { ApiProperty } from '@nestjs/swagger';

export class HospitalizacionMascotaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  sexo: string;
}

export class HospitalizacionVeterinarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  email: string;
}

export class HospitalizacionesResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  id_historial_fk: string;

  @ApiProperty()
  fecha_ingreso: Date;

  @ApiProperty({ required: false })
  fecha_alta?: Date;

  @ApiProperty()
  motivo_ingreso: string;

  @ApiProperty()
  estado_actual: string;

  @ApiProperty()
  costo_por_dia: number;

  @ApiProperty({ type: HospitalizacionMascotaResponseDto, required: false })
  mascota?: HospitalizacionMascotaResponseDto;

  @ApiProperty({ type: HospitalizacionVeterinarioResponseDto, required: false })
  veterinario?: HospitalizacionVeterinarioResponseDto;
}
