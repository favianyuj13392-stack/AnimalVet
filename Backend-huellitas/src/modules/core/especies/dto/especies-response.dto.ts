import { ApiProperty } from '@nestjs/swagger';

export class EspeciesResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre_especie: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
