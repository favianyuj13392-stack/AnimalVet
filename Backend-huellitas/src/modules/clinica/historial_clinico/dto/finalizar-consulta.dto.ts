import { IsNotEmpty, IsOptional, ValidateNested, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateHistorialClinicoDto } from './create-historial_clinico.dto';

export class FinalizarConsultaDto {
  @ValidateNested()
  @Type(() => CreateHistorialClinicoDto)
  @IsNotEmpty()
  historial: CreateHistorialClinicoDto;

  // Recibimos la receta como un array de detalles
  @IsArray()
  @IsNotEmpty({ message: 'La receta es obligatoria.' })
  receta: any[];

  @IsObject()
  @IsOptional()
  vacuna?: any;

  @IsObject()
  @IsOptional()
  hospitalizacion?: any;

  @IsArray()
  @IsOptional()
  archivos?: any[];
}