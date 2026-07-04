import { IsUUID, IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpedienteClinicoDto {
  @ApiProperty({ example: 'uuid-mascota' })
  @IsUUID('all', { message: 'ID de mascota debe ser un UUID válido' })
  id_mascota_fk: string;

  @ApiProperty({ example: '2026-04-13', required: false })
  @IsDateString()
  @IsOptional()
  fecha_apertura?: string;

  @ApiProperty({ example: 'Mascota sana sin antecedentes', required: false })
  @IsString()
  @IsOptional()
  notas_generales?: string;
}
