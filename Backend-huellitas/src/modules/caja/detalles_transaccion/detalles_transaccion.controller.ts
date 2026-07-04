import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DetallesTransaccionService } from './detalles_transaccion.service';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

@ApiTags('Caja - Detalles de transaccion')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('detalles-transaccion')
export class DetallesTransaccionController {
  constructor(private readonly detallesTransaccionService: DetallesTransaccionService) {}

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({
    summary: 'Listar detalles de transacciones',
    description: 'Endpoint de solo lectura. tipo_cobro es interno y viene de la DB: entrega para productos entregados/cobrados y previo para servicios clinicos o de hospitalizacion. El frontend no lo envia en venta directa.',
  })
  @ApiOkResponse({ description: 'Listado de detalles con producto, servicio, receta, lote y transaccion.' })
  findAll() {
    return this.detallesTransaccionService.findAll();
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener detalle de transaccion por UUID' })
  @ApiParam({ name: 'id', description: 'UUID del detalle de transaccion.' })
  @ApiOkResponse({ description: 'Detalle encontrado.' })
  @ApiNotFoundResponse({ description: 'Detalle no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.detallesTransaccionService.findOne(id);
  }
}
