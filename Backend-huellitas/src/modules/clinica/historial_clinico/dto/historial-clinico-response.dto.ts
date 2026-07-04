import { ApiProperty } from '@nestjs/swagger';

export class HistorialMascotaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  sexo: string;
}

export class HistorialVeterinarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  email: string;
}

export class HistorialCitaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  estado: string;
}

export class HistorialRecetaDetalleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  medicamento_texto?: string;

  @ApiProperty()
  dosis: string;

  @ApiProperty()
  frecuencia: string;

  @ApiProperty({ required: false })
  duracion_dias?: number;

  @ApiProperty({ required: false })
  producto?: {
    id: string;
    nombre: string;
  };
}

export class HistorialRecetaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  indicaciones_grales: string;

  @ApiProperty({ type: [HistorialRecetaDetalleResponseDto] })
  detalles: HistorialRecetaDetalleResponseDto[];
}

export class HistorialVacunaResponseDto {
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

  @ApiProperty({ required: false })
  vacuna?: {
    id: number;
    nombre: string;
  };
}

export class HistorialClinicoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fecha_consulta: Date;

  @ApiProperty()
  motivo_consulta: string;

  @ApiProperty({ required: false })
  sintomas?: string;

  @ApiProperty()
  peso_actual_kg: number;

  @ApiProperty()
  diagnostico: string;

  @ApiProperty({ required: false })
  notas_internas?: string;

  @ApiProperty()
  temperatura_c: number;

  @ApiProperty()
  frecuencia_cardiaca: number;

  @ApiProperty()
  frecuencia_respiratoria: number;

  @ApiProperty()
  tipo_atencion: string;

  @ApiProperty()
  triaje_completado: boolean;

  @ApiProperty({ description: 'Estado del historial clínico (Abierto, Cerrado, Facturado)', example: 'Abierto' })
  estado: string;

  @ApiProperty({ type: HistorialVeterinarioResponseDto, required: false })
  veterinario?: HistorialVeterinarioResponseDto;

  @ApiProperty({ type: HistorialMascotaResponseDto, required: false })
  mascota?: HistorialMascotaResponseDto;

  @ApiProperty({ type: HistorialCitaResponseDto, required: false })
  cita?: HistorialCitaResponseDto;

  @ApiProperty({ type: [HistorialRecetaResponseDto], required: false })
  recetas?: HistorialRecetaResponseDto[];

  @ApiProperty({ type: [HistorialVacunaResponseDto], required: false })
  vacunas_aplicadas?: HistorialVacunaResponseDto[];
}