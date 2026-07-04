import { IsString, IsNotEmpty, MaxLength, IsEmail, MinLength, IsOptional, IsInt, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Alejandro', description: 'Nombres del usuario' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @ApiProperty({ example: 'Pardo', description: 'Apellidos del usuario' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidos: string;

  @ApiProperty({ example: 'admin@huellitas.local' })
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @MaxLength(150)
  email: string;


  @ApiProperty({ example: 'Password123!', description: 'Contraseña en texto plano' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: '77712345', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ example: '12345678', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  ci?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  avatar_url?: string;

  @ApiProperty({ example: 4, description: 'ID del rol (1:Admin, 2:Vet, 3:Cajero, 4:Cliente)' })
  @IsInt()
  @IsPositive()
  id_rol_fk: number;

  @ApiProperty({ example: 'VET-2024-00123', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  numero_matricula?: string;
}