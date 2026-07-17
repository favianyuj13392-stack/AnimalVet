import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PatologiasService } from './patologias.service';

@ApiTags('Patologías')
@Controller('patologias')
export class PatologiasController {
  constructor(private readonly patologiasService: PatologiasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las patologías del catálogo' })
  async findAll() {
    return this.patologiasService.findAllPatologias();
  }
}
