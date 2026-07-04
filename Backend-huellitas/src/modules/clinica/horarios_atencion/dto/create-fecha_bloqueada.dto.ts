import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional, IsUUID, IsIn, Length } from 'class-validator';

export class CreateFechaBloqueadaDto {
  @ApiProperty({ description: 'Fecha a bloquear en formato YYYY-MM-DD', example: '2026-12-25' })
  @IsDateString({}, { message: 'La fecha debe ser un formato de fecha válido YYYY-MM-DD' })
  fecha: string;

  @ApiProperty({ description: 'Motivo del bloqueo (Feriado, Vacaciones, Emergencia)', example: 'Feriado' })
  @IsString()
  @IsIn(['Feriado', 'Vacaciones', 'Emergencia'], { message: 'El motivo debe ser Feriado, Vacaciones o Emergencia' })
  motivo: string;

  @ApiProperty({ description: 'UUID del veterinario (opcional, si es para vacaciones o emergencia individual)', required: false })
  @IsOptional()
  @IsUUID('all', { message: 'id_veterinario_fk debe ser un UUID válido' })
  id_veterinario_fk?: string;
}
