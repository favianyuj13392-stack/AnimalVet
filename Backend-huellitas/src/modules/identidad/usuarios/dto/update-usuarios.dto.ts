import { IsString, IsOptional} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUsuariosDto {
  @ApiProperty({ example: 'Juan Pérez Actualizado', required: false })
  @IsString()
  @IsOptional()
  nombre_completo?: string;

  @ApiProperty({ example: '+51987654321', required: false })
  @IsString()
  @IsOptional()
  numero_celular?: string;

  @ApiProperty({ example: 'juan-avatar-nuevo.jpg', required: false })
  @IsString()
  @IsOptional()
  foto_perfil?: string;

  @ApiProperty({ example: 'Inactivo', required: false })
  @IsString()
  @IsOptional()
  estado?: string;
}
