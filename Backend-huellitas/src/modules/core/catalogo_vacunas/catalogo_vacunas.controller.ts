import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CatalogoVacunasService } from './catalogo_vacunas.service';
import { CreateCatalogoVacunaDto } from './dto/create-catalogo_vacuna.dto';
import { UpdateCatalogoVacunaDto } from './dto/update-catalogo_vacuna.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

@ApiTags('Core - Catálogo de Vacunas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalogo-vacunas')
export class CatalogoVacunasController {
  constructor(private readonly vacunasService: CatalogoVacunasService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Crear una nueva vacuna maestra (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Vacuna creada exitosamente.' })
  create(@Body() createDto: CreateCatalogoVacunaDto) {
    return this.vacunasService.createVacuna(createDto);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todas las vacunas del catálogo' })
  @ApiResponse({ status: 200, description: 'Lista de vacunas.' })
  findAll() {
    return this.vacunasService.findAll();
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener vacuna por ID' })
  @ApiResponse({ status: 200, description: 'Vacuna encontrada.' })
  @ApiResponse({ status: 404, description: 'Vacuna no encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vacunasService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar una vacuna (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Vacuna actualizada.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCatalogoVacunaDto) {
    return this.vacunasService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Desactivar una vacuna (Soft Delete - Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Vacuna desactivada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vacunasService.remove(id);
  }

  @Post(':id/activar')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Reactivar una vacuna previamente desactivada' })
  @ApiResponse({ status: 200, description: 'Vacuna reactivada.' })
  activar(@Param('id', ParseIntPipe) id: number) {
    return this.vacunasService.activate(id);
  }
}