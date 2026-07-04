import { IsString, IsOptional} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExpedienteClinicoDto {
  @ApiProperty({ example: 'Actualizado con nueva información', required: false })
  @IsString()
  @IsOptional()
  notas_generales?: string;
}
