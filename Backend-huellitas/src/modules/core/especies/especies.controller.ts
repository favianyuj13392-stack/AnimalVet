import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EspeciesService } from './especies.service';
import { CreateEspecieDto } from './dto/create-especie.dto';
import { UpdateEspecieDto } from './dto/update-especie.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

@ApiTags('Core - Especies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('especies')
export class EspeciesController {
  constructor(private readonly especiesService: EspeciesService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Crear una nueva especie (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Especie creada exitosamente.' })
  @ApiResponse({ status: 409, description: 'La especie ya existe.' })
  create(@Body() createEspecieDto: CreateEspecieDto) {
    return this.especiesService.createEspecie(createEspecieDto);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todas las especies activas' })
  @ApiResponse({ status: 200, description: 'Lista de especies.' })
  findAll() {
    return this.especiesService.findAll();
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener una especie por ID' })
  @ApiResponse({ status: 200, description: 'Especie encontrada.' })
  @ApiResponse({ status: 404, description: 'Especie no encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.especiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar una especie (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Especie actualizada.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEspecieDto: UpdateEspecieDto,
  ) {
    return this.especiesService.update(id, updateEspecieDto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Desactivar una especie (Soft Delete - Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Especie desactivada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.especiesService.remove(id);
  }
}