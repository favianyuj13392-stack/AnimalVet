import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  ParseUUIDPipe, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { VacunasAplicadasService } from './vacunas_aplicadas.service';
import { CreateVacunasAplicadaDto } from './dto/create-vacunas_aplicada.dto';
import { UpdateVacunasAplicadaDto } from './dto/update-vacunas_aplicada.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { VacunasAplicadasResponseDto } from './dto/vacunas_aplicadas-response.dto';

@ApiTags('Clínica - Vacunas Aplicadas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vacunas-aplicadas')
export class VacunasAplicadasController {
  constructor(private readonly vacunasAplicadasService: VacunasAplicadasService) {}

  @Post()
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Registrar una vacuna aplicada en una consulta (Solo Vet/Admin)' })
  @ApiResponse({ status: 201, description: 'Vacuna registrada. La fecha de próxima dosis se calcula automáticamente.', type: VacunasAplicadasResponseDto })
  @ApiResponse({ status: 400, description: 'Historial no abierto.' })
  @ApiResponse({ status: 404, description: 'Historial o vacuna del catálogo no encontrada.' })
  create(@Body() createDto: CreateVacunasAplicadaDto, @Req() req: any): Promise<VacunasAplicadasResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.vacunasAplicadasService.create(createDto, req.user.id);
  }

  @Get('historial/:idHistorial')
  @Roles('Veterinario', 'Administrador', 'Cliente')
  @ApiOperation({ summary: 'Listar vacunas aplicadas de un historial clínico' })
  @ApiParam({ name: 'idHistorial', description: 'UUID del historial clínico' })
  @ApiResponse({ status: 200, description: 'Lista de vacunas aplicadas.', type: [VacunasAplicadasResponseDto] })
  findByHistorial(@Param('idHistorial', ParseUUIDPipe) idHistorial: string): Promise<VacunasAplicadasResponseDto[]> {
    return this.vacunasAplicadasService.findByHistorial(idHistorial);
  }

  @Get('alertas')
  @Roles('Veterinario', 'Administrador', 'Cliente')
  @ApiOperation({ summary: 'Obtener alertas de vacunas próximas o vencidas' })
  @ApiResponse({ status: 200, description: 'Lista de alertas de vacunas.' })
  obtenerAlertas(@Req() req: any): Promise<any[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.vacunasAplicadasService.obtenerAlertasProximas(req.user.id, req.user.rol);
  }

  @Get(':id')
  @Roles('Veterinario', 'Administrador', 'Cliente')
  @ApiOperation({ summary: 'Obtener un registro de vacuna aplicada por UUID' })
  @ApiParam({ name: 'id', description: 'UUID del registro de vacuna' })
  @ApiResponse({ status: 200, description: 'Registro encontrado.', type: VacunasAplicadasResponseDto })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VacunasAplicadasResponseDto> {
    return this.vacunasAplicadasService.findOne(id);
  }

  @Patch(':id')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Actualizar datos de una vacuna aplicada (Solo Vet/Admin)' })
  @ApiParam({ name: 'id', description: 'UUID del registro de vacuna' })
  @ApiResponse({ status: 200, description: 'Registro actualizado.', type: VacunasAplicadasResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateVacunasAplicadaDto,
    @Req() req: any,
  ): Promise<VacunasAplicadasResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.vacunasAplicadasService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @Roles('Veterinario', 'Administrador')
  @ApiOperation({ summary: 'Eliminar (Soft Delete) un registro de vacuna aplicada' })
  @ApiParam({ name: 'id', description: 'UUID del registro de vacuna' })
  @ApiResponse({ status: 200, description: 'Registro eliminado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vacunasAplicadasService.remove(id);
  }
}
