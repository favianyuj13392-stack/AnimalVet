import {
  Controller, Get, Post, Put, Delete, Body, Param,
  UseGuards, Req, Res, ParseUUIDPipe, Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RecetasService } from './recetas.service';
import { CreateRecetaDto } from './dto/create-recetas.dto';
import { UpdateRecetaDto } from './dto/update-receta.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { RecetasResponseDto } from './dto/recetas-response.dto';

@ApiTags('Recetas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recetas')
export class RecetasController {
  constructor(private readonly recetasService: RecetasService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Crear una nueva receta médica (con detalles incluidos)' })
  @ApiResponse({ status: 201, description: 'Receta creada exitosamente', type: RecetasResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o historial no abierto' })
  async crear(@Body() dto: CreateRecetaDto, @Req() req): Promise<RecetasResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.recetasService.crear(dto, req.user.id, req.user.rol);
  }

  @Get(':id/pdf')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Descargar receta médica en formato PDF (RF-09, HU-08)' })
  @ApiResponse({ status: 200, description: 'Archivo PDF de la receta médica.' })
  async descargarPdf(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() res: any,
  ): Promise<void> {
    const buffer = await this.recetasService.generarPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receta-${id.slice(-8)}.pdf"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  @Get(':id/formato')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener datos de receta completos y listos para imprimir en formato PDF' })
  @ApiResponse({ status: 200, description: 'Datos de formato de receta listos para impresión.' })
  obtenerFormatoImpresion(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<any> {
    return this.recetasService.obtenerFormatoImpresion(id);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener una receta por su ID' })
  @ApiResponse({ status: 200, description: 'Receta encontrada.', type: RecetasResponseDto })
  obtenerPorId(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<RecetasResponseDto> {
    return this.recetasService.obtenerPorId(id);
  }

  @Get('historial/:idHistorial')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todas las recetas de un historial clínico' })
  @ApiResponse({ status: 200, description: 'Lista de recetas obtenida.', type: [RecetasResponseDto] })
  obtenerPorHistorial(@Param('idHistorial', new ParseUUIDPipe({ version: '4' })) idHistorial: string): Promise<RecetasResponseDto[]> {
    return this.recetasService.obtenerPorHistorial(idHistorial);
  }

  @Put(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar indicaciones generales de una receta' })
  @ApiResponse({ status: 200, description: 'Receta actualizada.', type: RecetasResponseDto })
  actualizar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: UpdateRecetaDto): Promise<RecetasResponseDto> {
    return this.recetasService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Eliminar (soft delete) una receta' })
  @ApiResponse({ status: 200, description: 'Receta eliminada correctamente.' })
  eliminar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.recetasService.eliminar(id);
  }
}