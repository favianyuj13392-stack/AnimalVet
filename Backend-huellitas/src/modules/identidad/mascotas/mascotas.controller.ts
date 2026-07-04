import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, BadRequestException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MascotasService } from './mascotas.service';
import { CreateMascotaDto } from './dto/create-mascota.dto';
import { UpdateMascotaDto } from './dto/update-mascota.dto';
import { CreateUrgenciaDto } from './dto/create-urgencia.dto';

// 🛡️ Importaciones de Seguridad
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const TODOS = ['Administrador', 'Veterinario', 'Cajero', 'Cliente'] as const;

@ApiTags('Identidad - Mascotas')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mascotas')
export class MascotasController {
  constructor(private readonly mascotasService: MascotasService) {}

  @Post('urgencia')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Pre-registro de urgencia express y creación de cita En_Curso' })
  crearUrgencia(
    @Body() createUrgenciaDto: CreateUrgenciaDto,
    @CurrentUser('id') userId: string
  ) {
    return this.mascotasService.crearUrgencia(createUrgenciaDto, userId);
  }

  @Post(':idTemporal/vincular/:idReal')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Fusionar mascota temporal de urgencia con mascota real existente' })
  vincular(
    @Param('idTemporal', ParseUUIDPipe) idTemporal: string,
    @Param('idReal', ParseUUIDPipe) idReal: string,
    @CurrentUser('id') adminId: string
  ) {
    return this.mascotasService.vincularMascotas(idTemporal, idReal, adminId);
  }

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Registrar nueva mascota y generar QR' })
  create(
    @Body() createMascotaDto: CreateMascotaDto,
    @CurrentUser('id') userId: string
  ) {
    return this.mascotasService.createMascota(createMascotaDto, userId);
  }

  @Post('mi-mascota')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Cliente: auto-registrar su propia mascota (HU-26)' })
  createMiMascota(
    @Body() createMascotaDto: CreateMascotaDto,
    @CurrentUser('id') userId: string,
  ) {
    // El dueño siempre es el usuario autenticado, ignoramos id_dueno_fk del body
    createMascotaDto.id_dueno_fk = userId;
    return this.mascotasService.createMascota(createMascotaDto, userId);
  }

  @Get('reportes/estadisticas-mensuales')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener estadísticas de razas y especies atendidas por el veterinario este mes' })
  obtenerEstadisticasMensuales(@CurrentUser('id') userId: string) {
    return this.mascotasService.obtenerEstadisticasMensuales(userId);
  }

  @Get('mis-mascotas')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Cliente: listar solo mis mascotas registradas (HU-26)' })
  findMisMascotas(@Query('clienteId') clienteId: string) {
    return this.mascotasService.findMisMascotas(clienteId);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todas las mascotas con filtros opcionales' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o hash de QR' })
  @ApiQuery({ name: 'soloActivos', required: false, description: 'Filtrar solo pacientes activos hoy' })
  findAll(
    @Query('search') search?: string,
    @Query('soloActivos') soloActivos?: string,
  ) {
    const filterActivos = soloActivos === 'true';
    return this.mascotasService.findAllClean(search, filterActivos);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener mascota por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mascotasService.findOneClean(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Actualizar datos básicos de una mascota' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMascotaDto: UpdateMascotaDto,
    @CurrentUser() user: any
  ) {
    if (user.rol === 'Veterinario') {
      if (updateMascotaDto.id_dueno_fk !== undefined || updateMascotaDto.fecha_nacimiento !== undefined) {
        throw new BadRequestException('El veterinario no tiene permisos para modificar la fecha de nacimiento o el dueño de la mascota.');
      }
    }
    if (user.rol === 'Cliente') {
      const mascota = await this.mascotasService.findOneClean(id);
      if (mascota.id_dueno_fk !== user.id) {
        throw new BadRequestException('Solo puedes modificar tus propias mascotas.');
      }
    }
    return this.mascotasService.update(id, updateMascotaDto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Eliminar registro de mascota' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mascotasService.remove(id);
  }
}
