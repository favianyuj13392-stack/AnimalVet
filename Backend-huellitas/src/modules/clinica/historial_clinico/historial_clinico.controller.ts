import {
  Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe,
  Delete, UseGuards, Req, ForbiddenException, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { HistorialClinicoService } from './historial_clinico.service';
import { CreateHistorialClinicoDto } from './dto/create-historial_clinico.dto';
import { UpdateHistorialClinicoDto } from './dto/update-historial_clinico.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { HistorialClinicoResponseDto } from './dto/historial-clinico-response.dto';
import { FinalizarConsultaDto } from './dto/finalizar-consulta.dto';

@ApiTags('Historial Clínico')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('historial-clinico')
export class HistorialClinicoController {
  constructor(private readonly historialService: HistorialClinicoService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Crear un registro clínico para una consulta (Solo Vet)' })
  @ApiResponse({ status: 201, description: 'Historial clínico creado.', type: HistorialClinicoResponseDto })
  @ApiResponse({ status: 400, description: 'Expediente no encontrado o datos inválidos.' })
  create(
    @Body() createDto: CreateHistorialClinicoDto,
    @Req() req: any,
  ): Promise<HistorialClinicoResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.historialService.create(createDto, req.user.id);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar historiales — acepta ?mascotaId=UUID para filtrar por mascota' })
  @ApiResponse({ status: 200, description: 'Lista de historiales obtenida.', type: [HistorialClinicoResponseDto] })
  findAll(
    @Query('mascotaId') mascotaId?: string,
    @Query('before') before?: string,
    @Req() req?: any,
  ): Promise<HistorialClinicoResponseDto[]> {
    // Cliente solo puede consultar historiales si filtra por mascotaId (verificado en service via mi-mascota)
    // Sin mascotaId, el listado general está prohibido para Cliente
    if (req.user.rol === 'Cliente' && !mascotaId) {
      throw new ForbiddenException('Debes especificar ?mascotaId para consultar historiales.');
    }
    return this.historialService.findAll(mascotaId, before);
  }

  // ── Rutas estáticas PRIMERO (antes que :id) ──────────────────────────────────

  @Get('pendientes-cobro')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar historiales cerrados pendientes de cobro (para cajero)' })
  findPendientesCobro() {
    return this.historialService.findPendientesCobro();
  }

  // ── RF-25 | HU-28 — Portal cliente: expediente COMPLETO de su mascota ───────
  @Get('mi-mascota/:mascotaId')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({
    summary: 'Cliente: ver expediente completo de su mascota — historial, recetas, vacunas, hospitalizaciones (HU-28)',
  })
  @ApiParam({ name: 'mascotaId', description: 'UUID de la mascota del cliente' })
  @ApiResponse({ status: 200, description: 'Expediente completo de la mascota (sin notas internas del veterinario).' })
  @ApiResponse({ status: 404, description: 'Mascota no encontrada o no pertenece al cliente.' })
  findExpedienteCompleto(
    @Param('mascotaId', ParseUUIDPipe) mascotaId: string,
    @Req() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.historialService.findExpedienteCompleto(mascotaId, req.user.id);
  }

  // ── Rutas con parámetro UUID ──────────────────────────────────────────────────

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener un historial clínico detallado' })
  @ApiParam({ name: 'id', description: 'UUID del historial clínico' })
  @ApiResponse({ status: 200, description: 'Historial encontrado.', type: HistorialClinicoResponseDto })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HistorialClinicoResponseDto> {
    return this.historialService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar notas del historial (El diagnóstico es inmutable después de cerrado)' })
  @ApiParam({ name: 'id', description: 'UUID del historial' })
  @ApiResponse({ status: 200, description: 'Historial actualizado.', type: HistorialClinicoResponseDto })
  @ApiResponse({ status: 400, description: 'El historial está cerrado o facturado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateHistorialClinicoDto,
    @Req() req: any,
  ): Promise<HistorialClinicoResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.historialService.update(id, updateDto, req.user.id);
  }

  @Delete(':id/desactivar')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Desactivar historial clínico (Soft Delete - Solo Admin)' })
  @ApiParam({ name: 'id', description: 'UUID del historial' })
  @ApiResponse({ status: 200, description: 'Historial desactivado correctamente.' })
  @ApiResponse({ status: 404, description: 'Historial no encontrado.' })
  desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.historialService.desactivar(id);
  }

  @Post('finalizar')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Finalizar consulta completa (Transacción Todo o Nada)' })
  @ApiResponse({ status: 201, description: 'Consulta finalizada y guardada exitosamente.' })
  finalizarConsultaTotal(
    @Body() dto: FinalizarConsultaDto,
    @Req() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.historialService.finalizarConsultaTransaccional(dto, req.user.id);
  }
}