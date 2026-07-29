import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  ParseUUIDPipe, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

@ApiTags('Inventario - Productos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @Roles('Administrador')
  @ApiOperation({ summary: 'Registrar un nuevo producto en el inventario (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente.' })
  @ApiResponse({ status: 409, description: 'Ya existe un producto con ese nombre.' })
  create(@Body() createProductoDto: CreateProductoDto, @Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.productosService.create(createProductoDto, req.user.id);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero')
  @ApiOperation({ summary: 'Listar todos los productos activos del inventario' })
  @ApiResponse({ status: 200, description: 'Lista de productos.' })
  findAll(@Req() req: any) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const buscar = (req.query.buscar as string) || '';
    const categoria = (req.query.categoria as string) || 'todas';

    // Si no mandan page ni limit, devolvemos todo por compatibilidad con otras pantallas
    if (!req.query.page && !req.query.limit && !req.query.buscar && !req.query.categoria) {
      return this.productosService.findAll();
    }

    return this.productosService.findAllPaginated(page, limit, buscar, categoria);
  }

  @Get('alertas/stock-critico')
  @Roles('Administrador', 'Veterinario', 'Cajero')
  @ApiOperation({ summary: 'Listar productos con stock igual o inferior al minimo' })
  findStockCritico() {
    return this.productosService.findStockCritico();
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero')
  @ApiOperation({ summary: 'Obtener un producto por UUID' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Actualizar datos de un producto (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductoDto: UpdateProductoDto,
    @Req() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.productosService.update(id, updateProductoDto, req.user.id);
  }

  @Delete(':id')
  @Roles('Administrador')
  @ApiOperation({ summary: 'Desactivar un producto del inventario (Soft Delete - Solo Admin)' })
  @ApiParam({ name: 'id', description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: 'Producto desactivado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productosService.remove(id);
  }
}
