// src/modules/clinica/citas/dto/update-estado-cita.dto.ts
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EstadoCitaPermitido {
  Pendiente_Confirmacion = 'Pendiente_Confirmacion',
  Pendiente = 'Pendiente',
  Confirmada = 'Confirmada',
  En_Curso = 'En_Curso',
  Completada = 'Completada',
  Cancelada = 'Cancelada',
  No_Asistio = 'No_Asistio',
}

export class UpdateEstadoCitaDto {
  @ApiProperty({
    enum: EstadoCitaPermitido,
    example: EstadoCitaPermitido.En_Curso,
    description: 'El nuevo estado hacia el que transitará la cita'
  })
  @IsEnum(EstadoCitaPermitido, { 
    message: 'El estado proporcionado no es un estado válido del sistema.' 
  })
  estado: EstadoCitaPermitido;

  @ApiProperty({
    example: 'El cliente llamó para cancelar por motivos personales',
    description: 'El motivo de la cancelación. Obligatorio si el nuevo estado es Cancelada',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El motivo de cancelación debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El motivo de cancelación no puede exceder los 100 caracteres' })
  motivo_cancelacion?: string;
}
