import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RazasService } from './razas.service';
import { CreateRazaDto } from './dto/create-raza.dto';
import { UpdateRazaDto } from './dto/update-raza.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

@ApiTags('Core - Razas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('razas')
export class RazasController {
  constructor(private readonly razasService: RazasService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Crear una nueva raza (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Raza creada exitosamente.' })
  @ApiResponse({ status: 409, description: 'La raza ya existe.' })
  create(@Body() createRazaDto: CreateRazaDto) {
    return this.razasService.createRaza(createRazaDto);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todas las razas activas' })
  @ApiResponse({ status: 200, description: 'Lista de razas.' })
  findAll() {
    return this.razasService.findAll();
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener una raza por ID' })
  @ApiResponse({ status: 200, description: 'Raza encontrada.' })
  @ApiResponse({ status: 404, description: 'Raza no encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.razasService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar una raza (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Raza actualizada.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateRazaDto: UpdateRazaDto) {
    return this.razasService.update(id, updateRazaDto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Desactivar una raza (Soft Delete - Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Raza desactivada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.razasService.remove(id);
  }
}