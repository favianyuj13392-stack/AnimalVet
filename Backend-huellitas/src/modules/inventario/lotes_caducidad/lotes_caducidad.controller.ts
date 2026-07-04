import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LotesCaducidadService } from './lotes_caducidad.service';
import { CreateLotesCaducidadDto } from './dto/create-lotes_caducidad.dto';
import { UpdateLotesCaducidadDto } from './dto/update-lotes_caducidad.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { CurrentUser } from '../../identidad/auth/decorators/current-user.decorator';

@ApiTags('Inventario - Lotes y caducidad')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lotes-caducidad')
export class LotesCaducidadController {
  constructor(private readonly lotesCaducidadService: LotesCaducidadService) {}

  @Post()
  @Roles('Administrador')
  @ApiOperation({
    summary: 'Registrar ingreso de lote',
    description: 'Crea un lote, aumenta stock del producto y registra Kardex de tipo Entrada en una transaccion atomica.',
  })
  @ApiBody({ type: CreateLotesCaducidadDto })
  @ApiResponse({ status: 201, description: 'Lote creado y stock actualizado.' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado.' })
  create(@Body() dto: CreateLotesCaducidadDto, @CurrentUser('id') userId: string) {
    return this.lotesCaducidadService.create(dto, userId);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero')
  @ApiOperation({ summary: 'Listar lotes de caducidad' })
  @ApiQuery({ name: 'productoId', required: false, description: 'Filtra lotes por UUID de producto.' })
  @ApiOkResponse({ description: 'Listado de lotes ordenado por fecha de vencimiento.' })
  findAll(@Query('productoId') productoId?: string) {
    return this.lotesCaducidadService.findAll(productoId);
  }

  @Get('alertas/por-vencer')
  @Roles('Administrador', 'Veterinario', 'Cajero')
  @ApiOperation({ summary: 'Listar lotes proximos a vencer' })
  @ApiQuery({ name: 'dias', required: false, description: 'Ventana de alerta. Por defecto 60 dias.' })
  @ApiOkResponse({ description: 'Lotes con fecha de vencimiento dentro del rango indicado.' })
  findPorVencer(@Query('dias') dias?: string) {
    return this.lotesCaducidadService.findPorVencer(dias ? Number(dias) : 60);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero')
  @ApiOperation({ summary: 'Obtener lote por UUID' })
  @ApiParam({ name: 'id', description: 'UUID del lote.' })
  @ApiOkResponse({ description: 'Lote encontrado.' })
  @ApiNotFoundResponse({ description: 'Lote no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lotesCaducidadService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Actualizar datos administrativos de lote' })
  @ApiParam({ name: 'id', description: 'UUID del lote.' })
  @ApiBody({ type: UpdateLotesCaducidadDto })
  @ApiOkResponse({ description: 'Lote actualizado.' })
  @ApiNotFoundResponse({ description: 'Lote no encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLotesCaducidadDto: UpdateLotesCaducidadDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lotesCaducidadService.update(id, updateLotesCaducidadDto, userId);
  }

  @Delete(':id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Desactivar lote sin stock disponible' })
  @ApiParam({ name: 'id', description: 'UUID del lote.' })
  @ApiOkResponse({ description: 'Lote desactivado.' })
  @ApiBadRequestResponse({ description: 'No se puede desactivar un lote con unidades disponibles.' })
  @ApiNotFoundResponse({ description: 'Lote no encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.lotesCaducidadService.remove(id);
  }
}
