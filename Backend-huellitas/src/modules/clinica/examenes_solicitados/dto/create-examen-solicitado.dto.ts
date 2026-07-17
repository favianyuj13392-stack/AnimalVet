import { IsNotEmpty, IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';
import { EstadoExamenSolicitado } from '../entities/examen-solicitado.entity';

export class CreateExamenSolicitadoDto {
  @IsUUID(4, { message: 'El id_historial_fk debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El id_historial_fk es obligatorio.' })
  id_historial_fk: string;

  @IsString({ message: 'El tipo debe ser texto.' })
  @IsNotEmpty({ message: 'El tipo es obligatorio.' })
  tipo: string; // 'ECOGRAFIA' | 'RADIOGRAFIA' | 'LABORATORIO' | 'CITOLOGIA' | 'HISTOPATOLOGIA' | 'ELECTROCARDIOGRAMA' | 'OTRO'

  @IsEnum(EstadoExamenSolicitado, { message: 'El estado del examen solicitado no es válido.' })
  @IsOptional()
  estado?: EstadoExamenSolicitado;
}
