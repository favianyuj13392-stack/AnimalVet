import { Controller, Post, Get, Body, Param, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { SeguimientosClinicosService } from './seguimientos_clinicos.service';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';

@ApiTags('Seguimientos Clínicos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('seguimientos-clinicos')
export class SeguimientosClinicosController {
  constructor(private readonly seguimientosService: SeguimientosClinicosService) {}

  @Post()
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Registrar un nuevo seguimiento clínico (Solo Vet/Admin)' })
  crear(@Body() dto: CreateSeguimientoDto, @Req() req: any) {
    return this.seguimientosService.crear(dto, req.user.id);
  }

  @Get('historial/:idHistorial')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los seguimientos asociados a una consulta clínica' })
  listarPorConsulta(@Param('idHistorial', ParseUUIDPipe) idHistorial: string) {
    return this.seguimientosService.listarPorConsulta(idHistorial);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener el detalle de un seguimiento clínico' })
  obtenerDetalle(@Param('id', ParseUUIDPipe) id: string) {
    return this.seguimientosService.obtenerDetalle(id);
  }
}
