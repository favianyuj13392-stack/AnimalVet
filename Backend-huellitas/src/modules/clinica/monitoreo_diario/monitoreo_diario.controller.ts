import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  ParseUUIDPipe, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MonitoreoDiarioService } from './monitoreo_diario.service';
import { CreateMonitoreoDiarioDto } from './dto/create-monitoreo_diario.dto';
import { UpdateMonitoreoDiarioDto } from './dto/update-monitoreo_diario.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { MonitoreoDiarioResponseDto } from './dto/monitoreo_diario-response.dto';

@ApiTags('Clínica - Monitoreo Diario')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('monitoreo-diario')
export class MonitoreoDiarioController {
  constructor(private readonly monitoreoDiarioService: MonitoreoDiarioService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Registrar monitoreo clínico diario de un paciente hospitalizado (Solo Vet)' })
  @ApiResponse({ status: 201, description: 'Monitoreo clínico registrado.', type: MonitoreoDiarioResponseDto })
  create(@Body() createDto: CreateMonitoreoDiarioDto, @Req() req: any): Promise<MonitoreoDiarioResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.monitoreoDiarioService.create(createDto, req.user.id);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los monitoreos registrados' })
  @ApiResponse({ status: 200, description: 'Lista de monitoreos.', type: [MonitoreoDiarioResponseDto] })
  findAll(): Promise<MonitoreoDiarioResponseDto[]> {
    return this.monitoreoDiarioService.findAll();
  }

  @Get('hospitalizacion/:idHospitalizacion')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener monitoreos asociados a una hospitalización específica' })
  @ApiParam({ name: 'idHospitalizacion', description: 'UUID de la hospitalización' })
  @ApiResponse({ status: 200, description: 'Lista de monitoreos del paciente.', type: [MonitoreoDiarioResponseDto] })
  findByHospitalizacion(
    @Param('idHospitalizacion', ParseUUIDPipe) idHospitalizacion: string,
  ): Promise<MonitoreoDiarioResponseDto[]> {
    return this.monitoreoDiarioService.findByHospitalizacion(idHospitalizacion);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener un registro de monitoreo por UUID' })
  @ApiParam({ name: 'id', description: 'UUID del monitoreo' })
  @ApiResponse({ status: 200, description: 'Registro de monitoreo encontrado.', type: MonitoreoDiarioResponseDto })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MonitoreoDiarioResponseDto> {
    return this.monitoreoDiarioService.findOne(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar un registro de monitoreo clínico (Solo Vet)' })
  @ApiParam({ name: 'id', description: 'UUID del monitoreo' })
  @ApiResponse({ status: 200, description: 'Registro de monitoreo actualizado.', type: MonitoreoDiarioResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMonitoreoDiarioDto,
    @Req() req: any,
  ): Promise<MonitoreoDiarioResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.monitoreoDiarioService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Eliminar (Soft Delete) un registro de monitoreo clínico (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'UUID del monitoreo' })
  @ApiResponse({ status: 200, description: 'Registro de monitoreo eliminado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.monitoreoDiarioService.remove(id);
  }
}
