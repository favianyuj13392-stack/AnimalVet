import {
  Controller, Get, Post, Query, UseGuards, ParseUUIDPipe, Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';

import { RegistroNotificacionesService } from './registro_notificaciones.service';
import { MensajeroService } from '../mensajero/mensajero.service';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

@ApiTags('Notificaciones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notificaciones')
export class RegistroNotificacionesController {
  constructor(
    private readonly notifService: RegistroNotificacionesService,
    private readonly mensajero: MensajeroService,
  ) {}

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar notificaciones registradas en el sistema' })
  @ApiQuery({ name: 'estado', required: false, enum: ['Pendiente', 'Enviado', 'Error'] })
  @ApiResponse({ status: 200 })
  findAll(@Query('estado') estado?: string) {
    return this.notifService.findAll(estado);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Ver detalles de una notificación' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.notifService.findOne(id);
  }

  @Post(':id/reenviar')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Reenviar una notificación en estado Error o Pendiente' })
  @ApiParam({ name: 'id' })
  async reenviar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    await this.mensajero.enviar(id);
    return { mensaje: 'Reenvío iniciado.' };
  }
}
