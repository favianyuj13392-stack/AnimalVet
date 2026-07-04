import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  ParseUUIDPipe, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ArchivosAdjuntosService } from './archivos_adjuntos.service';
import { CreateArchivoAdjuntoDto } from './dto/create-archivos_adjunto.dto';
import { UpdateArchivosAdjuntoDto } from './dto/update-archivos_adjunto.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { ArchivosAdjuntosResponseDto } from './dto/archivos_adjuntos-response.dto';

@ApiTags('Clínica - Archivos Adjuntos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('archivos-adjuntos')
export class ArchivosAdjuntosController {
  constructor(private readonly archivosAdjuntosService: ArchivosAdjuntosService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Adjuntar un archivo (radiografía, laboratorio, etc.) a un historial clínico' })
  @ApiResponse({ status: 201, description: 'Archivo registrado exitosamente.', type: ArchivosAdjuntosResponseDto })
  create(@Body() createDto: CreateArchivoAdjuntoDto, @Req() req: any): Promise<ArchivosAdjuntosResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.archivosAdjuntosService.create(createDto, req.user.id);
  }

  @Get('historial/:idHistorial')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los archivos adjuntos de un historial clínico' })
  @ApiParam({ name: 'idHistorial', description: 'UUID del historial clínico' })
  @ApiResponse({ status: 200, description: 'Lista de archivos adjuntos.', type: [ArchivosAdjuntosResponseDto] })
  findByHistorial(@Param('idHistorial', ParseUUIDPipe) idHistorial: string): Promise<ArchivosAdjuntosResponseDto[]> {
    return this.archivosAdjuntosService.findByHistorial(idHistorial);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener un archivo adjunto por UUID' })
  @ApiParam({ name: 'id', description: 'UUID del archivo adjunto' })
  @ApiResponse({ status: 200, description: 'Archivo encontrado.', type: ArchivosAdjuntosResponseDto })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ArchivosAdjuntosResponseDto> {
    return this.archivosAdjuntosService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar estado o datos del archivo adjunto' })
  @ApiParam({ name: 'id', description: 'UUID del archivo adjunto' })
  @ApiResponse({ status: 200, description: 'Archivo actualizado.', type: ArchivosAdjuntosResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateArchivosAdjuntoDto,
    @Req() req: any,
  ): Promise<ArchivosAdjuntosResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.archivosAdjuntosService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Eliminar (Soft Delete) un archivo adjunto' })
  @ApiParam({ name: 'id', description: 'UUID del archivo adjunto' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.archivosAdjuntosService.remove(id);
  }
}
