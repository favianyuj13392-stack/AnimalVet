import {
  Controller, Get, Query, Param, UseGuards, Req,
  BadRequestException, ParseUUIDPipe, ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiResponse, ApiQuery, ApiParam,
} from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../identidad/auth/guards/roles.guard';
import { Roles } from '../identidad/auth/decorators/roles.decorator';

@ApiTags('Reportes Gerenciales')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  private parseDates(inicioStr?: string, finStr?: string) {
    let inicio = new Date();
    inicio.setFullYear(inicio.getFullYear() - 1);
    let fin = new Date();
    fin.setFullYear(fin.getFullYear() + 1); // incluir citas futuras

    if (inicioStr) {
      inicio = new Date(`${inicioStr}T00:00:00`);
      if (isNaN(inicio.getTime()))
        throw new BadRequestException('fecha_inicio inválida. Use formato YYYY-MM-DD.');
    }
    if (finStr) {
      fin = new Date(`${finStr}T23:59:59.999`);
      if (isNaN(fin.getTime()))
        throw new BadRequestException('fecha_fin inválida. Use formato YYYY-MM-DD.');
    }
    if (inicio > fin)
      throw new BadRequestException('fecha_inicio no puede ser posterior a fecha_fin.');

    return { inicio, fin };
  }

  // ── Dashboard ejecutivo ─────────────────────────────────────────────────
  @Get('dashboard')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Dashboard ejecutivo completo — KPIs, gráficas y métricas por año/mes' })
  @ApiQuery({ name: 'anio',  required: false, description: 'Año (default: año actual)' })
  @ApiQuery({ name: 'mes',   required: false, description: 'Mes 1-12 (omitir para todo el año)' })
  async obtenerDashboard(
    @Query('anio') anioStr?: string,
    @Query('mes')  mesStr?: string,
  ) {
    const anio = anioStr ? parseInt(anioStr, 10) : new Date().getFullYear();
    const mes  = mesStr  ? parseInt(mesStr,  10) : undefined;
    return this.reportesService.obtenerDashboard(anio, mes);
  }

  // ── Reporte financiero general ──────────────────────────────────────────
  @Get('financiero')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Reporte financiero de ingresos por rango de fechas (Solo Administrador)' })
  @ApiQuery({ name: 'fecha_inicio', required: false })
  @ApiQuery({ name: 'fecha_fin', required: false })
  @ApiResponse({ status: 200, description: 'Reporte financiero.' })
  async obtenerReporteFinanciero(
    @Query('fecha_inicio') inicioStr?: string,
    @Query('fecha_fin') finStr?: string,
  ) {
    const { inicio, fin } = this.parseDates(inicioStr, finStr);
    return this.reportesService.obtenerReporteFinanciero(inicio, fin);
  }

  // ── Reporte financiero filtrado por cajero ──────────────────────────────
  @Get('financiero/cajero/:cajeroId')
  @Roles('Administrador', 'Cajero')
  @ApiOperation({ summary: 'Reporte de caja filtrado por cajero + cierres de turno (HU-20). Cajero solo puede ver su propio reporte.' })
  @ApiParam({ name: 'cajeroId', description: 'UUID del cajero' })
  @ApiQuery({ name: 'fecha_inicio', required: false })
  @ApiQuery({ name: 'fecha_fin', required: false })
  @ApiResponse({ status: 200, description: 'Reporte de caja por cajero con desglose de cierres.' })
  async obtenerReportePorCajero(
    @Param('cajeroId', new ParseUUIDPipe({ version: '4' })) cajeroId: string,
    @Req() req: any,
    @Query('fecha_inicio') inicioStr?: string,
    @Query('fecha_fin') finStr?: string,
  ) {
    if (req.user.rol === 'Cajero' && req.user.id !== cajeroId) {
      throw new ForbiddenException('Un cajero solo puede consultar su propio reporte.');
    }
    const { inicio, fin } = this.parseDates(inicioStr, finStr);
    return this.reportesService.obtenerReportePorCajero(cajeroId, inicio, fin);
  }

  // ── Reporte de citas ────────────────────────────────────────────────────
  @Get('citas')
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Distribución de citas por estado y productividad médica (HU-32)' })
  @ApiQuery({ name: 'fecha_inicio', required: false })
  @ApiQuery({ name: 'fecha_fin', required: false })
  @ApiQuery({ name: 'veterinarioId', required: false })
  @ApiResponse({ status: 200, description: 'Reporte de citas.' })
  async obtenerReporteCitas(
    @Query('fecha_inicio') inicioStr?: string,
    @Query('fecha_fin') finStr?: string,
    @Query('veterinarioId') veterinarioId?: string,
  ) {
    const { inicio, fin } = this.parseDates(inicioStr, finStr);
    return this.reportesService.obtenerReporteCitas(inicio, fin, veterinarioId);
  }

  // ── Stock crítico e inventario ──────────────────────────────────────────
  @Get('inventario')
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Inventario completo y productos bajo stock mínimo (HU-33)' })
  @ApiResponse({ status: 200, description: 'Reporte de inventario.' })
  async obtenerReporteInventario() {
    return this.reportesService.obtenerReporteInventario();
  }

  // ── Lotes próximos a vencer ─────────────────────────────────────────────
  @Get('lotes-por-vencer')
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Lotes de productos próximos a vencer (HU-23). Por defecto: 60 días.' })
  @ApiQuery({ name: 'dias', required: false, description: 'Horizonte en días (default: 60)' })
  @ApiResponse({ status: 200, description: 'Lotes próximos a vencer.' })
  async obtenerLotesPorVencer(@Query('dias') diasStr?: string) {
    const dias = diasStr ? parseInt(diasStr, 10) : 60;
    if (isNaN(dias) || dias <= 0)
      throw new BadRequestException('El parámetro dias debe ser un número positivo.');
    return this.reportesService.obtenerLotesPorVencer(dias);
  }

  // ── Vacunas pendientes ──────────────────────────────────────────────────
  @Get('vacunas-pendientes')
  @Roles('Administrador', 'Veterinario', 'Cajero')
  @ApiOperation({ summary: 'Mascotas con vacuna próxima a vencer (HU-12, HU-31). Por defecto: 30 días.' })
  @ApiQuery({ name: 'dias', required: false, description: 'Horizonte en días (default: 30)' })
  @ApiResponse({ status: 200, description: 'Vacunas pendientes con datos del dueño para recordatorio.' })
  async obtenerVacunasPendientes(@Query('dias') diasStr?: string) {
    const dias = diasStr ? parseInt(diasStr, 10) : 30;
    if (isNaN(dias) || dias <= 0)
      throw new BadRequestException('El parámetro dias debe ser un número positivo.');
    return this.reportesService.obtenerVacunasPendientes(dias);
  }

  // ── Ficha completa de mascota ───────────────────────────────────────────
  @Get('ficha-mascota/:mascotaId')
  @Roles('Administrador', 'Veterinario', 'Cajero')
  @ApiOperation({ summary: 'Ficha completa de mascota: especie, raza y datos del dueño (HU-28)' })
  @ApiParam({ name: 'mascotaId', description: 'UUID de la mascota' })
  @ApiResponse({ status: 200, description: 'Ficha completa de la mascota.' })
  async obtenerFichaMascota(
    @Param('mascotaId', new ParseUUIDPipe({ version: '4' })) mascotaId: string,
  ) {
    const ficha = await this.reportesService.obtenerFichaMascota(mascotaId);
    if (!ficha) throw new BadRequestException('Mascota no encontrada.');
    return ficha;
  }
}
