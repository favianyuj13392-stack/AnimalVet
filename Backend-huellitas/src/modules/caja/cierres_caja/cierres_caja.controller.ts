import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CierresCajaService } from './cierres_caja.service';
import { CreateCierresCajaDto } from './dto/create-cierres_caja.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { CurrentUser } from '../../identidad/auth/decorators/current-user.decorator';

@ApiTags('Caja - Cierres')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cierres-caja')
export class CierresCajaController {
  constructor(private readonly cierreService: CierresCajaService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({
    summary: 'Generar cierre de caja inmutable',
    description: 'Calcula totales desde transacciones completadas del cajero, fecha y turno. Un cierre generado no se modifica ni elimina.',
  })
  @ApiBody({ type: CreateCierresCajaDto })
  @ApiResponse({ status: 201, description: 'Cierre generado correctamente.' })
  @ApiBadRequestResponse({ description: 'No hay transacciones completadas para cerrar.' })
  @ApiConflictResponse({ description: 'Ya existe cierre para ese cajero, fecha y turno.' })
  create(@Body() dto: CreateCierresCajaDto, @CurrentUser('id') userId: string) {
    return this.cierreService.create(dto, userId);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar cierres de caja' })
  @ApiOkResponse({ description: 'Listado de cierres ordenado por fecha de cierre.' })
  findAll() {
    return this.cierreService.findAll();
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener cierre de caja por UUID' })
  @ApiParam({ name: 'id', description: 'UUID del cierre de caja.' })
  @ApiOkResponse({ description: 'Cierre encontrado.' })
  @ApiNotFoundResponse({ description: 'Cierre no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.cierreService.findOne(id);
  }
}
