import { ApiProperty } from '@nestjs/swagger';

export class ConfiguracionClinicaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  clave: string;

  @ApiProperty()
  valor: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  updatedBy: string;
}
