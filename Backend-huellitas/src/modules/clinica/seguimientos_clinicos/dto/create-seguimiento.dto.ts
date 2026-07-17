import { IsNotEmpty, IsUUID, IsString, IsOptional, IsNumber, IsInt, IsArray } from 'class-validator';

export class CreateSeguimientoDto {
  @IsUUID(4, { message: 'El id_historial_clinico_fk debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El id_historial_clinico_fk es obligatorio.' })
  id_historial_clinico_fk: string;

  @IsString({ message: 'El motivo debe ser texto.' })
  @IsNotEmpty({ message: 'El motivo es obligatorio.' })
  motivo: string;

  @IsString({ message: 'Los síntomas deben ser texto.' })
  @IsOptional()
  sintomas?: string;

  @IsString({ message: 'Las observaciones deben ser texto.' })
  @IsOptional()
  observaciones?: string;

  @IsString({ message: 'El tratamiento debe ser texto.' })
  @IsOptional()
  tratamiento?: string;

  @IsString({ message: 'El diagnóstico actual debe ser texto.' })
  @IsOptional()
  diagnostico_actual?: string;

  @IsString({ message: 'Las recomendaciones deben ser texto.' })
  @IsOptional()
  recomendaciones?: string;

  @IsNumber({}, { message: 'El peso debe ser numérico.' })
  @IsOptional()
  peso_kg?: number;

  @IsNumber({}, { message: 'La temperatura debe ser numérica.' })
  @IsOptional()
  temperatura_c?: number;

  @IsInt({ message: 'La frecuencia cardíaca debe ser un número entero.' })
  @IsOptional()
  frecuencia_cardiaca?: number;

  @IsInt({ message: 'La frecuencia respiratoria debe ser un número entero.' })
  @IsOptional()
  frecuencia_respiratoria?: number;

  @IsString({ message: 'Las mucosas deben ser texto.' })
  @IsOptional()
  mucosas?: string;

  @IsArray()
  @IsOptional()
  receta?: any[];

  @IsString()
  @IsOptional()
  estado?: string; // 'BORRADOR' | 'FINALIZADO'
}
