import { ApiProperty } from '@nestjs/swagger';

export class CategoriasProductoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre_categoria: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
