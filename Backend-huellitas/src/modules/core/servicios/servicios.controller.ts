import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { Public } from '../../identidad/auth/decorators/public.decorator';

@ApiTags('Core - Servicios')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('servicios')
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Crear un nuevo servicio (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Servicio creado exitosamente.' })
  create(@Body() createServicioDto: CreateServicioDto) {
    return this.serviciosService.createServicio(createServicioDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar todos los servicios activos (público)' })
  @ApiResponse({ status: 200, description: 'Lista de servicios.' })
  findAll() {
    return this.serviciosService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener un servicio por ID (público)' })
  @ApiResponse({ status: 200, description: 'Servicio encontrado.' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar un servicio (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Servicio actualizado.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateServicioDto: UpdateServicioDto) {
    return this.serviciosService.update(id, updateServicioDto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Desactivar un servicio (Soft Delete - Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Servicio desactivado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviciosService.remove(id);
  }
}