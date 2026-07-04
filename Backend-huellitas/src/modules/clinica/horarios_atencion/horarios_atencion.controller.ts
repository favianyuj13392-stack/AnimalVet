import {
  Controller, Post, Body, Get, Param, ParseUUIDPipe,
  Patch, Delete, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { HorariosAtencionService } from './horarios_atencion.service';
import { CreateHorarioDto } from './dto/create-horarios_atencion.dto';
import { UpdateHorariosAtencionDto } from './dto/update-horarios_atencion.dto';
import { HorariosAtencionResponseDto } from './dto/horarios_atencion-response.dto';
import { CreateFechaBloqueadaDto } from './dto/create-fecha_bloqueada.dto';

@ApiTags('Horarios de Atención')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('horarios-atencion')
export class HorariosAtencionController {
  constructor(private readonly horariosService: HorariosAtencionService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Asignar un nuevo bloque de horario a un veterinario (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Horario creado exitosamente.', type: HorariosAtencionResponseDto })
  @ApiResponse({ status: 409, description: 'El veterinario ya tiene horario asignado para ese día.' })
  create(
    @Body() createHorarioDto: CreateHorarioDto,
    @Req() req: any,
  ): Promise<HorariosAtencionResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.horariosService.create(createHorarioDto, req.user.id);
  }

  @Get('veterinario/:id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener todos los horarios activos de un veterinario' })
  @ApiParam({ name: 'id', description: 'UUID del veterinario' })
  @ApiResponse({ status: 200, description: 'Lista de horarios ordenada por día.', type: [HorariosAtencionResponseDto] })
  findAllByVet(@Param('id', ParseUUIDPipe) id: string): Promise<HorariosAtencionResponseDto[]> {
    return this.horariosService.findAllByVeterinario(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Modificar un horario existente (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'UUID del horario a modificar' })
  @ApiResponse({ status: 200, description: 'Horario actualizado.', type: HorariosAtencionResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHorarioDto: UpdateHorariosAtencionDto,
  ): Promise<HorariosAtencionResponseDto> {
    return this.horariosService.update(id, updateHorarioDto);
  }

  @Patch(':id/desactivar')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Desactivar un horario (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'UUID del horario a desactivar' })
  @ApiResponse({ status: 200, description: 'Horario desactivado.' })
  desactivar(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.horariosService.desactivar(id);
  }

  // --- ENDPOINTS DE BLOQUEO DE FECHAS ---

  @Post('bloqueos')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Registrar un bloqueo de fecha por feriado, vacaciones o emergencia (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Bloqueo registrado exitosamente.' })
  crearBloqueo(
    @Body() dto: CreateFechaBloqueadaDto,
    @Req() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.horariosService.crearBloqueo(dto, req.user.id);
  }

  @Get('bloqueos')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todas las fechas bloqueadas activas (feriados, vacaciones, etc.)' })
  listarBloqueos() {
    return this.horariosService.listarBloqueos();
  }

  @Delete('bloqueos/:id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Eliminar/desbloquear una fecha inhabilitada (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'UUID del bloqueo a eliminar' })
  @ApiResponse({ status: 200, description: 'Bloqueo eliminado correctamente.' })
  eliminarBloqueo(@Param('id', ParseUUIDPipe) id: string) {
    return this.horariosService.eliminarBloqueo(id);
  }
}