import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KardexInventarioService } from './kardex_inventario.service';
import { CreateKardexInventarioDto } from './dto/create-kardex_inventario.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { CurrentUser } from '../../identidad/auth/decorators/current-user.decorator';

@ApiTags('Inventario - Kardex')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kardex-inventario')
export class KardexInventarioController {
  constructor(private readonly kardexInventarioService: KardexInventarioService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({
    summary: 'Registrar movimiento manual de Kardex',
    description: 'Registra Entrada, Salida_Venta, Salida_Clinica, Merma o Ajuste. Para salidas valida stock y lote. Merma/Salida_Clinica/Ajuste requieren motivo.',
  })
  @ApiBody({ type: CreateKardexInventarioDto })
  @ApiResponse({ status: 201, description: 'Movimiento creado y stock actualizado.' })
  @ApiBadRequestResponse({ description: 'Movimiento invalido, sin motivo obligatorio o stock insuficiente.' })
  @ApiNotFoundResponse({ description: 'Producto o lote no encontrado.' })
  create(@Body() dto: CreateKardexInventarioDto, @CurrentUser('id') userId: string) {
    return this.kardexInventarioService.create(dto, userId);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar movimientos de Kardex' })
  @ApiQuery({ name: 'productoId', required: false, description: 'Filtra movimientos por UUID de producto.' })
  @ApiOkResponse({ description: 'Listado de movimientos inmutables de inventario.' })
  findAll(@Query('productoId') productoId?: string) {
    return this.kardexInventarioService.findAll(productoId);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener movimiento de Kardex por UUID' })
  @ApiParam({ name: 'id', description: 'UUID del movimiento.' })
  @ApiOkResponse({ description: 'Movimiento encontrado.' })
  @ApiNotFoundResponse({ description: 'Movimiento no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.kardexInventarioService.findOne(id);
  }
}
