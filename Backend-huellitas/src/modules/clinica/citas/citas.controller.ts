import {
  Controller, Post, Body, Patch, Param, ParseUUIDPipe,
  UseGuards, Req, Get, Query, Delete, HttpCode, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateEstadoCitaDto } from './dto/update-estado-cita.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { CitaResponseDto } from './dto/cita-response.dto';

@ApiTags('Citas Médicas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Agendar una nueva cita médica' })
  @ApiResponse({ status: 201, description: 'Cita agendada exitosamente.', type: CitaResponseDto })
  @ApiResponse({ status: 400, description: 'Horario inválido o fuera del turno.' })
  @ApiResponse({ status: 409, description: 'Conflicto de horario con otra cita.' })
  create(
    @Body() createCitaDto: CreateCitaDto,
    @Req() req: any,
  ): Promise<CitaResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.citasService.create(createCitaDto, req.user.id);
  }

  @Get('reportes/anual')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener reporte anual de citas con absentismo y productividad' })
  @ApiQuery({ name: 'anio', required: true, description: 'Año a consultar' })
  @ApiResponse({ status: 200, description: 'Reporte generado.' })
  obtenerReporteAnual(@Query('anio') anio: string): Promise<any> {
    const anioNum = parseInt(anio, 10);
    if (isNaN(anioNum)) {
      throw new BadRequestException('El año proporcionado no es válido.');
    }
    return this.citasService.obtenerReporteAnual(anioNum);
  }

  @Patch(':id/estado')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar el estado de una cita (Máquina de estados)' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiResponse({ status: 200, description: 'Estado actualizado exitosamente.', type: CitaResponseDto })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida.' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada.' })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEstadoDto: UpdateEstadoCitaDto,
    @Req() req: any,
  ): Promise<CitaResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.citasService.cambiarEstado(id, updateEstadoDto.estado, req.user.id, req.user.rol, updateEstadoDto.motivo_cancelacion);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener todas las citas médicas con filtros de búsqueda' })
  @ApiQuery({ name: 'mascotaId', required: false, description: 'Filtrar por UUID de la mascota' })
  @ApiQuery({ name: 'veterinarioId', required: false, description: 'Filtrar por UUID del veterinario' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado de la cita' })
  @ApiQuery({ name: 'fecha', required: false, description: 'Filtrar por fecha (formato YYYY-MM-DD)' })
  @ApiQuery({ name: 'clienteId', required: false, description: 'Filtrar por UUID del cliente (dueño de mascota)' })
  @ApiResponse({ status: 200, description: 'Lista de citas obtenida.', type: [CitaResponseDto] })
  findAll(
    @Query('mascotaId') mascotaId?: string,
    @Query('veterinarioId') veterinarioId?: string,
    @Query('estado') estado?: string,
    @Query('fecha') fecha?: string,
    @Query('clienteId') clienteId?: string,
    @Req() req?: any,
  ): Promise<CitaResponseDto[]> {
    // Cliente solo puede ver sus propias citas
    if (req.user.rol === 'Cliente') {
      if (clienteId && clienteId !== req.user.id) {
        throw new ForbiddenException('Solo puedes consultar tus propias citas.');
      }
      clienteId = req.user.id;
    }
    return this.citasService.findAll({ mascotaId, veterinarioId, estado, fecha, clienteId });
  }

  @Get('pendientes-cobro')
  @Roles('Administrador', 'Cajero')
  @ApiOperation({ summary: 'Historiales cerrados pendientes de cobro por mascota — solo datos de facturación' })
  @ApiQuery({ name: 'mascotaId', required: false, description: 'Filtrar por UUID de mascota' })
  @ApiResponse({ status: 200, description: 'Lista de historiales pendientes de cobro.' })
  pendientesCobro(@Query('mascotaId') mascotaId?: string): Promise<any[]> {
    return this.citasService.findPendientesCobro(mascotaId);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener una cita por su UUID' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiResponse({ status: 200, description: 'Cita encontrada.', type: CitaResponseDto })
  @ApiResponse({ status: 404, description: 'Cita no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CitaResponseDto> {
    return this.citasService.findOne(id);
  }

  @Delete(':id')
  @Roles('Administrador')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar una cita (Soft Delete) — Solo Administrador' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiResponse({ status: 204, description: 'Cita eliminada exitosamente.' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada.' })
  async softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.citasService.softDeleteCita(id);
  }

  @Post(':id/restaurar')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Restaurar una cita eliminada — Solo Administrador' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiResponse({ status: 200, description: 'Cita restaurada exitosamente.', type: CitaResponseDto })
  @ApiResponse({ status: 404, description: 'Cita no encontrada.' })
  restaurar(@Param('id', ParseUUIDPipe) id: string): Promise<CitaResponseDto> {
    return this.citasService.restaurarCita(id);
  }

  @Get('disponibilidad/:veterinarioId')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  async obtenerDisponibilidad(
    @Param('veterinarioId') veterinarioId: string,
    @Query('fecha') fecha: string,
  ) {
    if (!fecha) {
      throw new BadRequestException('Debe proporcionar la fecha en formato YYYY-MM-DD');
    }
    return this.citasService.obtenerDisponibilidad(veterinarioId, fecha);
  }
}