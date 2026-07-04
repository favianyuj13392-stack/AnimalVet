import { ApiProperty } from '@nestjs/swagger';

export class RolesResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre_rol: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
