import { IsNotEmpty, IsUUID, IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { TipoInformeClinico, EstadoInformeClinico } from '../entities/informe-clinico.entity';

export class CreateInformeClinicoDto {
  @IsUUID(4, { message: 'El id_mascota_fk debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El id_mascota_fk es obligatorio.' })
  id_mascota_fk: string;

  @IsUUID(4, { message: 'El id_historial_fk debe ser un UUID válido.' })
  @IsOptional()
  id_historial_fk?: string;

  @IsUUID(4, { message: 'El id_seguimiento_fk debe ser un UUID válido.' })
  @IsOptional()
  id_seguimiento_fk?: string;

  @IsUUID(4, { message: 'El id_hospitalizacion_fk debe ser un UUID válido.' })
  @IsOptional()
  id_hospitalizacion_fk?: string;

  @IsEnum(TipoInformeClinico, { message: 'El tipo de informe no es válido.' })
  @IsNotEmpty({ message: 'El tipo es obligatorio.' })
  tipo: TipoInformeClinico;

  @IsEnum(EstadoInformeClinico, { message: 'El estado del informe no es válido.' })
  @IsOptional()
  estado?: EstadoInformeClinico;

  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  titulo: string;

  @IsString({ message: 'El comentario clínico debe ser texto.' })
  @IsOptional()
  comentario_clinico?: string;

  @IsString({ message: 'La conclusión debe ser texto.' })
  @IsOptional()
  conclusion?: string;

  @IsString({ message: 'Las recomendaciones deben ser texto.' })
  @IsOptional()
  recomendaciones?: string;

  @IsArray()
  @IsOptional()
  imagenes?: string[];

  @IsObject()
  @IsOptional()
  datos_estructurados?: Record<string, any>;
}
