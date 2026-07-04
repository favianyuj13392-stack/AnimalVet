import { ApiProperty } from '@nestjs/swagger';
import { HistorialClinicoResponseDto } from '../../historial_clinico/dto/historial-clinico-response.dto';

export class ExpedienteMascotaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  sexo: string;
}

export class ExpedienteClinicoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fecha_apertura: Date;

  @ApiProperty({ required: false })
  notas_generales?: string;

  @ApiProperty({ type: ExpedienteMascotaResponseDto, required: false })
  mascota?: ExpedienteMascotaResponseDto;

  @ApiProperty({ type: [HistorialClinicoResponseDto], required: false })
  historiales?: HistorialClinicoResponseDto[];
}

