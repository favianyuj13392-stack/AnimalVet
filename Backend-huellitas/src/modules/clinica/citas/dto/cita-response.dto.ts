import { ApiProperty } from '@nestjs/swagger';

export class CitaDuenoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  telefono?: string | null;
}

export class CitaRazaResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ required: false })
  especie?: { id: number; nombre: string } | null;
}

export class CitaMascotaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty({ required: false })
  foto_url?: string | null;

  @ApiProperty()
  sexo: string;

  @ApiProperty({ required: false })
  fecha_nacimiento?: Date | null;

  @ApiProperty({ type: CitaRazaResponseDto, required: false })
  raza?: CitaRazaResponseDto | null;

  @ApiProperty({ type: CitaDuenoResponseDto, required: false })
  dueno?: CitaDuenoResponseDto | null;
}

export class CitaVeterinarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombres: string;

  @ApiProperty()
  apellidos: string;

  @ApiProperty()
  email: string;
}

export class CitaServicioResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  duracion_minutos: number;

  @ApiProperty()
  precio: number;
}

export class CitaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fecha_hora_inicio: Date;

  @ApiProperty()
  duracion_minutos: number;

  @ApiProperty()
  motivo_cita: string;

  @ApiProperty()
  tipo_prioridad: string;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  origen_reserva: string;

  @ApiProperty()
  requiere_confirmacion: boolean;

  @ApiProperty({ type: CitaMascotaResponseDto, required: false })
  mascota?: CitaMascotaResponseDto;

  @ApiProperty({ type: CitaVeterinarioResponseDto, required: false })
  veterinario?: CitaVeterinarioResponseDto;

  @ApiProperty({ type: CitaServicioResponseDto, required: false })
  servicio?: CitaServicioResponseDto;

  @ApiProperty({ required: false })
  motivo_cancelacion?: string | null;

  @ApiProperty({ required: false, description: 'Fecha de eliminación lógica si fue cancelada o eliminada' })
  deletedAt?: Date;

  @ApiProperty({ description: 'Fecha de creación de la cita (cuando fue agendada)' })
  createdAt?: Date;

  @ApiProperty({ description: 'Fecha de última actualización — refleja cuándo cambió de estado (ej: cuándo fue atendida)' })
  updatedAt?: Date;
}
