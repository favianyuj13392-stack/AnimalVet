import {
  Controller, Get, Post, Body, Put, Param, Delete,
  ParseUUIDPipe, UseGuards, Req, Res, Query, Header, ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ZoosanitarioService } from './zoosanitario.service';
import { JwtAuthGuard } from '../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../identidad/auth/guards/roles.guard';
import { Roles } from '../identidad/auth/decorators/roles.decorator';
import { CreateDesparasitacionDto } from './desparasitaciones/dto/create-desparasitacion.dto';
import { UpdateDesparasitacionDto } from './desparasitaciones/dto/update-desparasitacion.dto';
import { CreateCirugiaRegistroDto } from './cirugias/dto/create-cirugia-registro.dto';
import { UpdateCirugiaRegistroDto } from './cirugias/dto/update-cirugia-registro.dto';
import { CreateTratamientoZooDto } from './tratamientos-zoo/dto/create-tratamiento-zoo.dto';
import { UpdateTratamientoZooDto } from './tratamientos-zoo/dto/update-tratamiento-zoo.dto';
import { CreateProgramaSanitarioItemDto } from './programa-sanitario/dto/create-programa-sanitario-item.dto';
import { UpdateProgramaSanitarioItemDto } from './programa-sanitario/dto/update-programa-sanitario-item.dto';

@ApiTags('Zoosanitario - Tarjeta de Control')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('zoosanitario')
export class ZoosanitarioController {
  constructor(private readonly zoosanitarioService: ZoosanitarioService) {}

  // --- ORQUESTADOR / TARJETA COMPLETA ---
  @Get('mascota/:mascotaId')
  @Roles('Veterinario', 'Administrador', 'Cliente')
  @ApiOperation({ summary: 'Obtener la tarjeta de control zoosanitario completa de una mascota' })
  @ApiParam({ name: 'mascotaId', description: 'UUID de la mascota' })
  obtenerTarjetaControl(@Param('mascotaId', ParseUUIDPipe) mascotaId: string) {
    return this.zoosanitarioService.obtenerTarjetaControl(mascotaId);
  }

  @Get('mascota/:mascotaId/pdf')
  @Roles('Veterinario', 'Administrador', 'Cliente')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Generar PDF del Carnet Zoosanitario' })
  async generarPdf(
    @Param('mascotaId', ParseUUIDPipe) mascotaId: string,
    @Res() res: any
  ) {
    const buffer = await this.zoosanitarioService.generarPdf(mascotaId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="carnet-zoosanitario-${mascotaId.slice(-8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // --- CRUD DESPARASITACIONES ---
  @Post('desparasitaciones')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Registrar una desparasitación (Solo Vet/Admin)' })
  createDesparasitacion(@Body() dto: CreateDesparasitacionDto, @Req() req: any) {
    return this.zoosanitarioService.createDesparasitacion(dto, req.user.id);
  }

  @Get('desparasitaciones')
  @Roles('Veterinario', 'Administrador', 'Cliente')
  @ApiOperation({ summary: 'Listar desparasitaciones de una mascota' })
  @ApiQuery({ name: 'mascotaId', description: 'UUID de la mascota' })
  findDesparasitaciones(@Query('mascotaId', ParseUUIDPipe) mascotaId: string) {
    return this.zoosanitarioService.findDesparasitacionesByMascota(mascotaId);
  }

  @Put('desparasitaciones/:id')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Actualizar una desparasitación (Solo Vet/Admin)' })
  updateDesparasitacion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDesparasitacionDto
  ) {
    return this.zoosanitarioService.updateDesparasitacion(id, dto);
  }

  @Delete('desparasitaciones/:id')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Eliminar una desparasitación (Solo Vet/Admin)' })
  removeDesparasitacion(@Param('id', ParseUUIDPipe) id: string) {
    return this.zoosanitarioService.removeDesparasitacion(id);
  }

  // --- CRUD CIRUGIAS ---
  @Post('cirugias')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Registrar una cirugía histórica (Solo Vet/Admin)' })
  createCirugia(@Body() dto: CreateCirugiaRegistroDto, @Req() req: any) {
    return this.zoosanitarioService.createCirugia(dto, req.user.id);
  }

  @Get('cirugias')
  @Roles('Veterinario', 'Administrador', 'Cliente')
  @ApiOperation({ summary: 'Listar cirugías de una mascota' })
  @ApiQuery({ name: 'mascotaId', description: 'UUID de la mascota' })
  findCirugias(@Query('mascotaId', ParseUUIDPipe) mascotaId: string) {
    return this.zoosanitarioService.findCirugiasByMascota(mascotaId);
  }

  @Put('cirugias/:id')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Actualizar registro de cirugía (Solo Vet/Admin)' })
  updateCirugia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCirugiaRegistroDto
  ) {
    return this.zoosanitarioService.updateCirugia(id, dto);
  }

  @Delete('cirugias/:id')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Eliminar registro de cirugía (Solo Vet/Admin)' })
  removeCirugia(@Param('id', ParseUUIDPipe) id: string) {
    return this.zoosanitarioService.removeCirugia(id);
  }

  // --- CRUD TRATAMIENTOS LIBRES ---
  @Post('tratamientos')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Registrar un tratamiento libre (Solo Vet/Admin)' })
  createTratamiento(@Body() dto: CreateTratamientoZooDto, @Req() req: any) {
    return this.zoosanitarioService.createTratamiento(dto, req.user.id);
  }

  @Get('tratamientos')
  @Roles('Veterinario', 'Administrador', 'Cliente')
  @ApiOperation({ summary: 'Listar tratamientos de una mascota' })
  @ApiQuery({ name: 'mascotaId', description: 'UUID de la mascota' })
  findTratamientos(@Query('mascotaId', ParseUUIDPipe) mascotaId: string) {
    return this.zoosanitarioService.findTratamientosByMascota(mascotaId);
  }

  @Put('tratamientos/:id')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Actualizar registro de tratamiento (Solo Vet/Admin)' })
  updateTratamiento(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTratamientoZooDto
  ) {
    return this.zoosanitarioService.updateTratamiento(id, dto);
  }

  @Delete('tratamientos/:id')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Eliminar registro de tratamiento (Solo Vet/Admin)' })
  removeTratamiento(@Param('id', ParseUUIDPipe) id: string) {
    return this.zoosanitarioService.removeTratamiento(id);
  }

  // --- CONFIGURACIÓN PROGRAMA SANITARIO (ADMIN) ---
  @Post('programa')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Agregar un ítem al programa sanitario (Solo Admin)' })
  createProgramaItem(@Body() dto: CreateProgramaSanitarioItemDto, @Req() req: any) {
    return this.zoosanitarioService.createProgramaItem(dto, req.user.id);
  }

  @Get('programa')
  @Roles('Veterinario', 'Administrador', 'Cliente')
  @ApiOperation({ summary: 'Listar ítems del programa sanitario preventivo' })
  @ApiQuery({ name: 'especie', required: false, description: 'Canino o Felino' })
  findProgramaItems(@Query('especie') especie?: string) {
    return this.zoosanitarioService.findAllProgramaItems(especie);
  }

  @Put('programa/:id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Actualizar un ítem del programa sanitario (Solo Admin)' })
  updateProgramaItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgramaSanitarioItemDto,
    @Req() req: any
  ) {
    return this.zoosanitarioService.updateProgramaItem(id, dto, req.user.id);
  }

  @Delete('programa/:id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Eliminar un ítem del programa sanitario (Solo Admin)' })
  removeProgramaItem(@Param('id', ParseIntPipe) id: number) {
    return this.zoosanitarioService.removeProgramaItem(id);
  }
}
