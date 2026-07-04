import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DetallesRecetaService } from './detalles_receta.service';
import { CreateDetalleRecetaDto } from './dto/create-detalles_receta.dto';
import { UpdateDetalleRecetaDto } from './dto/update-detalles_receta.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { DetallesRecetaResponseDto } from './dto/detalles_receta-response.dto';

@ApiTags('Detalles Receta')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('detalles-receta')
export class DetallesRecetaController {
  constructor(private readonly detallesService: DetallesRecetaService) {}

  @Post(':idReceta')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Agregar un detalle a una receta existente' })
  @ApiResponse({ status: 201, description: 'Detalle agregado exitosamente.', type: DetallesRecetaResponseDto })
  @ApiResponse({ status: 404, description: 'Receta o producto no encontrado.' })
  crear(
    @Param('idReceta', new ParseUUIDPipe({ version: '4' })) idReceta: string,
    @Body() dto: CreateDetalleRecetaDto,
    @Req() req,
  ): Promise<DetallesRecetaResponseDto> {
    return this.detallesService.crear(
      idReceta,
      dto,
      req.user.id,
      req.user.rol,
    );
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener un detalle por su ID' })
  @ApiResponse({ status: 200, description: 'Detalle encontrado.', type: DetallesRecetaResponseDto })
  obtenerPorId(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<DetallesRecetaResponseDto> {
    return this.detallesService.obtenerPorId(id);
  }

  @Put(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Modificar un detalle de receta' })
  @ApiResponse({ status: 200, description: 'Detalle modificado.', type: DetallesRecetaResponseDto })
  actualizar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: UpdateDetalleRecetaDto): Promise<DetallesRecetaResponseDto> {
    return this.detallesService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Eliminar (soft delete) un detalle' })
  @ApiResponse({ status: 200, description: 'Detalle de receta eliminado.' })
  eliminar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.detallesService.eliminar(id);
  }
}