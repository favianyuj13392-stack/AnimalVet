import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHistorialClinicoDto {
  @ApiProperty({ example: 'Se recomienda bañar con champú especial', required: false })
  @IsString()
  @IsOptional()
  notas_internas?: string;
}

