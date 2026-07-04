import { Body, Controller, Delete, Get, Header, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { TransaccionesCajaService } from './transacciones_caja.service';
import { CreateTransaccionesCajaDto } from './dto/create-transacciones_caja.dto';
import { CreateCobroClinicoDto } from './dto/create-cobro-clinico.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { CurrentUser } from '../../identidad/auth/decorators/current-user.decorator';

@ApiTags('Caja - Transacciones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transacciones-caja')
export class TransaccionesCajaController {
  constructor(private readonly transaccionesCajaService: TransaccionesCajaService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({
    summary: 'Procesar venta directa de mostrador',
    description: 'Venta POS directa SOLO para productos fisicos. No recibe servicios, vacunas, recetas, historial ni hospitalizacion. Crea detalles_transaccion con tipo_cobro interno entrega, descuenta stock/lotes y genera Kardex Salida_Venta.',
  })
  @ApiBody({ type: CreateTransaccionesCajaDto })
  @ApiResponse({ status: 201, description: 'Venta procesada. Retorna la transaccion creada.' })
  @ApiBadRequestResponse({ description: 'Datos invalidos, descuento mayor al subtotal o stock insuficiente.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente o invalido.' })
  create(@Body() createTransaccionesCajaDto: CreateTransaccionesCajaDto, @CurrentUser('id') userId: string) {
    return this.transaccionesCajaService.create(createTransaccionesCajaDto, userId);
  }

  @Post('desde-historial/:idHistorial')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({
    summary: 'Generar cobro automatico desde historial clinico',
    description: 'Lee cita, servicio, recetas y vacunas del historial. Crea detalles_transaccion internos: servicios con tipo_cobro=previo y productos con tipo_cobro=entrega. Cobra vacunas ya consumidas sin descontar stock otra vez. Los productos de receta si descuentan stock al cobrarse.',
  })
  @ApiParam({ name: 'idHistorial', description: 'UUID del historial clinico a cobrar.' })
  @ApiBody({ type: CreateCobroClinicoDto })
  @ApiResponse({ status: 201, description: 'Cobro generado desde historial.' })
  @ApiBadRequestResponse({ description: 'Historial sin conceptos, descuento invalido o historial ya cobrado.' })
  @ApiNotFoundResponse({ description: 'Historial o servicio de vacunacion no encontrado.' })
  createDesdeHistorial(
    @Param('idHistorial', ParseUUIDPipe) idHistorial: string,
    @Body() dto: CreateCobroClinicoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transaccionesCajaService.createDesdeHistorial(idHistorial, dto, userId);
  }

  @Post('desde-hospitalizacion/:idHospitalizacion')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({
    summary: 'Generar cobro automatico desde hospitalizacion',
    description: 'Lee dias de hospitalizacion, insumos, servicios y vacunas aplicadas. Crea detalles_transaccion internos: servicios con tipo_cobro=previo y productos con tipo_cobro=entrega. No descuenta de nuevo productos clinicos ya consumidos durante la hospitalizacion.',
  })
  @ApiParam({ name: 'idHospitalizacion', description: 'UUID de la hospitalizacion a cobrar.' })
  @ApiBody({ type: CreateCobroClinicoDto })
  @ApiResponse({ status: 201, description: 'Cobro generado desde hospitalizacion.' })
  @ApiBadRequestResponse({ description: 'Hospitalizacion sin conceptos, descuento invalido o ya cobrada.' })
  @ApiNotFoundResponse({ description: 'Hospitalizacion, servicio de vacunacion o servicio de hospitalizacion no encontrado.' })
  createDesdeHospitalizacion(
    @Param('idHospitalizacion', ParseUUIDPipe) idHospitalizacion: string,
    @Body() dto: CreateCobroClinicoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.transaccionesCajaService.createDesdeHospitalizacion(idHospitalizacion, dto, userId);
  }

  @Get()
  @Roles('Administrador', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar transacciones de caja con filtros opcionales' })
  @ApiQuery({ name: 'cajeroId', required: false, description: 'Filtrar por UUID del cajero' })
  @ApiQuery({ name: 'clienteId', required: false, description: 'Filtrar por UUID del cliente' })
  @ApiQuery({ name: 'fecha', required: false, description: 'Filtrar por fecha YYYY-MM-DD' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado: Completada | Anulada' })
  @ApiOkResponse({ description: 'Listado de transacciones.' })
  findAll(
    @Query('cajeroId') cajeroId?: string,
    @Query('clienteId') clienteId?: string,
    @Query('fecha') fecha?: string,
    @Query('estado') estado?: string,
  ) {
    return this.transaccionesCajaService.findAll({ cajeroId, clienteId, fecha, estado });
  }

  @Get(':id/comprobante')
  @Roles('Administrador', 'Cajero')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Descargar comprobante de venta en PDF' })
  @ApiParam({ name: 'id', description: 'UUID de la transaccion.' })
  async descargarComprobante(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const buffer = await this.transaccionesCajaService.generarComprobante(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="comprobante-${id.slice(-8)}.pdf"`,
    });
    res.end(buffer);
  }

  @Get(':id')
  @Roles('Administrador', 'Cajero')
  @ApiOperation({ summary: 'Obtener transaccion de caja por UUID' })
  @ApiParam({ name: 'id', description: 'UUID de la transaccion.' })
  @ApiOkResponse({ description: 'Transaccion encontrada.' })
  @ApiNotFoundResponse({ description: 'Transaccion no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transaccionesCajaService.findOne(id);
  }

  @Patch(':id/anular')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({
    summary: 'Anular transaccion de caja',
    description: 'Marca la transaccion como Anulada. No elimina registros ni revierte automaticamente Kardex.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la transaccion a anular.' })
  @ApiOkResponse({ description: 'Transaccion anulada.' })
  @ApiBadRequestResponse({ description: 'La transaccion no esta en estado Completada.' })
  @ApiNotFoundResponse({ description: 'Transaccion no encontrada.' })
  cancelar(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.transaccionesCajaService.cancelar(id, userId);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Operacion bloqueada: caja no elimina transacciones' })
  @ApiParam({ name: 'id', description: 'UUID recibido solo por compatibilidad de ruta.' })
  @ApiBadRequestResponse({ description: 'Las transacciones no se eliminan; use anulacion controlada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.transaccionesCajaService.remove();
  }
}
