import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InteraccionesBotService } from './interacciones_bot.service';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

@ApiTags('Interacciones Bot')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('interacciones-bot')
export class InteraccionesBotController {
  constructor(private readonly service: InteraccionesBotService) {}

  @Get()
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Listar todas las interacciones del bot' })
  findAll() {
    return this.service.findAll();
  }

  @Get('numero/:numero')
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Ver historial de conversación por número de WhatsApp' })
  @ApiParam({ name: 'numero', example: '59171234567' })
  porNumero(@Param('numero') numero: string) {
    return this.service.obtenerPorNumero(numero);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Ver detalle de una interacción' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }
}
