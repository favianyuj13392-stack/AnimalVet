import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LogsSistemaService } from './logs_sistema.service';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

@ApiTags('Logs del Sistema (Auditoría)')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrador')
@Controller('logs-sistema')
export class LogsSistemaController {
  constructor(private readonly logsService: LogsSistemaService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener logs recientes', 
    description: 'Retorna un listado general de las últimas acciones registradas en el sistema. Uso exclusivo para auditores y administradores.' 
  })
  @ApiQuery({ 
    name: 'limite', 
    required: false, 
    type: String, 
    example: '50',
    description: 'Número máximo de registros a devolver (por defecto 50).' 
  })
  @ApiResponse({ status: 200, description: 'Lista de logs recientes devuelta con éxito.' })
  @ApiResponse({ status: 401, description: 'No autorizado (Token faltante o inválido).' })
  @ApiResponse({ status: 403, description: 'Prohibido (El usuario no tiene rol de Administrador).' })
  async obtenerRecientes(@Query('limite') limite?: string) {
    const limitNumber = limite ? parseInt(limite, 10) : 50;
    return this.logsService.findRecientes(limitNumber);
  }

  @Get('categoria/:categoria')
  @ApiOperation({ 
    summary: 'Filtrar logs por categoría', 
    description: 'Obtiene el historial de acciones filtrado por una categoría específica.' 
  })
  @ApiParam({ 
    name: 'categoria', 
    type: String, 
    example: 'FINANZAS', 
    description: 'Valores válidos: SEGURIDAD, CLINICO, INVENTARIO, FINANZAS, SISTEMA.' 
  })
  @ApiResponse({ status: 200, description: 'Logs de la categoría solicitada devueltos con éxito.' })
  async obtenerPorCategoria(@Param('categoria') categoria: string) {
    return this.logsService.findByCategoria(categoria.toUpperCase());
  }

  @Get('usuario/:usuarioId')
  @ApiOperation({ 
    summary: 'Filtrar logs por usuario', 
    description: 'Retorna el rastro de auditoría detallado de todas las acciones realizadas por un cajero, médico o administrador específico.' 
  })
  @ApiParam({ 
    name: 'usuarioId', 
    type: String, 
    description: 'UUID del usuario a auditar (Ej. id_cajero_fk).' 
  })
  @ApiResponse({ status: 200, description: 'Historial del usuario devuelto con éxito.' })
  async obtenerPorUsuario(@Param('usuarioId') usuarioId: string) {
    return this.logsService.findByUsuario(usuarioId);
  }
}