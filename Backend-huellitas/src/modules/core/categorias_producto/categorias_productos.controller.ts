import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CategoriasProductoService } from './categorias_productos.service';
import { CreateCategoriaProductoDto } from './dto/create-categorias_producto.dto';
import { UpdateCategoriasProductoDto } from './dto/update-categorias_producto.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

@ApiTags('Core - Categorías de Producto')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categorias-producto')
export class CategoriasProductoController {
  constructor(private readonly categoriasService: CategoriasProductoService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Crear una nueva categoría (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Categoría creada exitosamente.' })
  @ApiResponse({ status: 409, description: 'La categoría ya existe.' })
  create(@Body() createCategoriaProductoDto: CreateCategoriaProductoDto) {
    return this.categoriasService.createCategoria(createCategoriaProductoDto);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todas las categorías activas' })
  @ApiResponse({ status: 200, description: 'Lista de categorías.' })
  findAll() {
    return this.categoriasService.findAll();
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar una categoría (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoriasProductoDto: UpdateCategoriasProductoDto) {
    return this.categoriasService.update(id, updateCategoriasProductoDto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Desactivar una categoría (Soft Delete - Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Categoría desactivada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.remove(id);
  }
}