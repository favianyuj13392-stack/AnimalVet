import { IsUUID, IsInt, IsString, Min, Max, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHorarioDto {
  @ApiProperty({ 
    example: 1, 
    description: 'Día de la semana (1 = Lunes, 2 = Martes... 7 = Domingo)' 
  })
  @IsInt()
  @Min(1, { message: 'El día debe ser mayor o igual a 1 (Lunes)' })
  @Max(7, { message: 'El día debe ser menor o igual a 7 (Domingo)' })
  dia_semana: number;

  @ApiProperty({ 
    example: '09:00:00', 
    description: 'Hora exacta de inicio del turno en formato HH:MM:SS' 
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { 
    message: 'La hora de inicio debe tener el formato válido HH:MM:SS' 
  })
  hora_inicio: string;

  @ApiProperty({ 
    example: '13:00:00', 
    description: 'Hora exacta de fin del turno en formato HH:MM:SS' 
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { 
    message: 'La hora de fin debe tener el formato válido HH:MM:SS' 
  })
  hora_fin: string;

  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: 'UUID del veterinario al que se le asigna el horario' 
  })
  @IsUUID('all', { message: 'El ID del veterinario debe ser un UUID válido' })
  id_veterinario_fk: string;
}