import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  ParseUUIDPipe, UseGuards, Req, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { HospitalizacionesService } from './hospitalizaciones.service';
import { CreateHospitalizacioneDto } from './dto/create-hospitalizacione.dto';
import { UpdateHospitalizacioneDto } from './dto/update-hospitalizacione.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { HospitalizacionesResponseDto } from './dto/hospitalizaciones-response.dto';

@ApiTags('Clínica - Hospitalizaciones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hospitalizaciones')
export class HospitalizacionesController {
  constructor(private readonly hospitalizacionesService: HospitalizacionesService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Registrar ingreso de mascota a hospitalización (Solo Vet)' })
  @ApiResponse({ status: 201, description: 'Hospitalización registrada exitosamente.', type: HospitalizacionesResponseDto })
  create(@Body() createHospitalizacioneDto: CreateHospitalizacioneDto, @Req() req: any): Promise<HospitalizacionesResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.hospitalizacionesService.create(createHospitalizacioneDto, req.user.id);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar hospitalizaciones con filtro opcional por estado' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado: Observacion | Estable | Critico | Alta' })
  @ApiResponse({ status: 200, description: 'Lista de hospitalizaciones.', type: [HospitalizacionesResponseDto] })
  findAll(@Query('estado') estado?: string): Promise<HospitalizacionesResponseDto[]> {
    return this.hospitalizacionesService.findAll(estado);
  }

  @Get('mascota/:idMascota')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar hospitalizaciones de una mascota (incluye portal cliente)' })
  @ApiParam({ name: 'idMascota', description: 'UUID de la mascota' })
  findByMascota(
    @Param('idMascota', ParseUUIDPipe) idMascota: string,
  ): Promise<any[]> {
    return this.hospitalizacionesService.findByMascota(idMascota);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener una hospitalización por UUID' })
  @ApiParam({ name: 'id', description: 'UUID de la hospitalización' })
  @ApiResponse({ status: 200, description: 'Hospitalización encontrada.', type: HospitalizacionesResponseDto })
  @ApiResponse({ status: 404, description: 'Hospitalización no encontrada.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HospitalizacionesResponseDto> {
    return this.hospitalizacionesService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar datos de una hospitalización (estado, alta, etc.) (Solo Vet)' })
  @ApiParam({ name: 'id', description: 'UUID de la hospitalización' })
  @ApiResponse({ status: 200, description: 'Hospitalización actualizada.', type: HospitalizacionesResponseDto })
  @ApiResponse({ status: 404, description: 'Hospitalización no encontrada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHospitalizacioneDto: UpdateHospitalizacioneDto,
    @Req() req: any,
  ): Promise<HospitalizacionesResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.hospitalizacionesService.update(id, updateHospitalizacioneDto, req.user.id);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Desactivar o archivar hospitalización (Soft Delete - Solo Admin)' })
  @ApiParam({ name: 'id', description: 'UUID de la hospitalización' })
  @ApiResponse({ status: 200, description: 'Hospitalización desactivada.' })
  @ApiResponse({ status: 404, description: 'Hospitalización no encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.hospitalizacionesService.remove(id);
  }
}
