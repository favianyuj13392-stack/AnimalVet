import { ApiProperty } from '@nestjs/swagger';

export class RazasResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre_raza: string;

  @ApiProperty()
  id_especie_fk: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
