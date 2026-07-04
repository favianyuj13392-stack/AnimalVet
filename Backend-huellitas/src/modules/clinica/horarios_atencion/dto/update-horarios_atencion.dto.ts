import { IsInt, IsString, Min, Max, Matches, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHorariosAtencionDto {
  @ApiProperty({ 
    example: 1, 
    description: 'Día de la semana (1 = Lunes, 2 = Martes... 7 = Domingo)',
    required: false
  })
  @IsInt()
  @Min(1, { message: 'El día debe ser mayor o igual a 1 (Lunes)' })
  @Max(7, { message: 'El día debe ser menor o igual a 7 (Domingo)' })
  @IsOptional()
  dia_semana?: number;

  @ApiProperty({ 
    example: '09:00:00', 
    description: 'Hora exacta de inicio del turno en formato HH:MM:SS',
    required: false
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { 
    message: 'La hora de inicio debe tener el formato válido HH:MM:SS' 
  })
  @IsOptional()
  hora_inicio?: string;

  @ApiProperty({ 
    example: '13:00:00', 
    description: 'Hora exacta de fin del turno en formato HH:MM:SS',
    required: false
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, { 
    message: 'La hora de fin debe tener el formato válido HH:MM:SS' 
  })
  @IsOptional()
  hora_fin?: string;

  @ApiProperty({
    example: true,
    description: 'Estado activo del horario de atención',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

