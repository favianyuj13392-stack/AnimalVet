// src/modules/clinica/citas/dto/create-cita.dto.ts
import { IsUUID, IsInt, IsString, IsEnum, MaxLength, IsDate } from 'class-validator'; // Quitamos IsDateString y ponemos IsDate
import { Type } from 'class-transformer'; // Añadimos esto
import { ApiProperty } from '@nestjs/swagger';

export enum OrigenReserva {
  WEB = 'WEB',
  BOT_WA = 'BOT_WA',
  RECEPCION = 'RECEPCION',
}

export class CreateCitaDto {
  @ApiProperty({ 
    example: '2026-04-15T10:00:00.000Z', 
    description: 'Fecha y hora de inicio de la cita en formato ISO 8601' 
  })
  @Type(() => Date) // Transforma el texto de Postman en un objeto Date real
  @IsDate({ message: 'La fecha de inicio debe ser una fecha válida' })
  fecha_hora_inicio: Date; // Cambiamos el tipo de string a Date

  // ... el resto de tu DTO se queda exactamente igual ...
  @ApiProperty({ 
    example: 'Consulta por dolor estomacal y vómitos', 
    maxLength: 150 
  })
  @IsString()
  @MaxLength(150)
  motivo_cita: string;

  @ApiProperty({ 
    enum: OrigenReserva, 
    example: OrigenReserva.WEB,
    description: 'Canal por el cual se agendó la cita'
  })
  @IsEnum(OrigenReserva, { message: 'El origen de la reserva no es válido' })
  origen_reserva: OrigenReserva;

  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'UUID de la mascota paciente' 
  })
  @IsUUID('all', { message: 'El ID de la mascota debe ser un UUID válido' })
  id_mascota_fk: string;

  @ApiProperty({ 
    example: '987fcdeb-51a2-43d7-9012-345678901234', 
    description: 'UUID del veterinario que atenderá' 
  })
  @IsUUID('all', { message: 'El ID del veterinario debe ser un UUID válido' })
  id_veterinario_fk: string;

  @ApiProperty({ 
    example: 1, 
    description: 'ID del servicio solicitado (ej. 1 para Consulta, 2 para Peluquería)' 
  })
  @IsInt({ message: 'El ID del servicio es obligatorio para agendar una cita' })
  id_servicio_fk: number;
}