import { IsString, IsEmail, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuariosDto {
  @ApiProperty({ example: 'juan@huellitas.pe' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Pass123!@' })
  @IsString()
  password_hash: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  nombre_completo: string;

  @ApiProperty({ example: 'uuid-rol' })
  @IsUUID('all')
  id_rol_fk: string;

  @ApiProperty({ example: 'Activo' })
  @IsString()
  estado: string;

  @ApiProperty({ example: '+51987654321', required: false })
  @IsString()
  @IsOptional()
  numero_celular?: string;

  @ApiProperty({ example: 'juan-avatar.jpg', required: false })
  @IsString()
  @IsOptional()
  foto_perfil?: string;
}
