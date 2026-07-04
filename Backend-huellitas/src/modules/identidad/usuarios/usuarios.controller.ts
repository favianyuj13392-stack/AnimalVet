import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

// 🛡️ Importaciones de Seguridad
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// ── Endpoint PÚBLICO — sin JWT ───────────────────────────────────────────────
@ApiTags('Público - Veterinarios')
@Controller('publico/veterinarios')
export class VeterinariosPublicoController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar veterinarios activos para la página pública' })
  findVeterinarios() {
    return this.usuariosService.findVeterinariosPublico();
  }
}

@ApiTags('Identidad - Usuarios')
@ApiBearerAuth('access-token') // Candado en Swagger
@UseGuards(JwtAuthGuard, RolesGuard) // Activa la seguridad global del controlador
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente') // Solo staff autorizado crea usuarios
  @ApiOperation({ summary: 'Crear usuario (Cajero solo crea Clientes)' })
  create(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @CurrentUser() usuario: any // 👈 Atrapamos todo el usuario (ID y Rol)
  ) {
    // Le pasamos los datos reales del usuario que hizo la petición
    return this.usuariosService.createUsuario(
      createUsuarioDto, 
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      usuario.id, 
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      usuario.rol
    );
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los usuarios activos' })
  findAll() {
    return this.usuariosService.findAllClean();
  }

  @Get('clientes')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los usuarios Clientes (incluyendo inactivos)' })
  findClientes() {
    return this.usuariosService.findClientes();
  }

  @Get('personal')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los usuarios de Personal/Staff (incluyendo inactivos)' })
  findPersonal() {
    return this.usuariosService.findPersonal();
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener un usuario por UUID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findOneClean(id);
  }

  @Patch(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente') // Solo Admin edita perfiles de otros
  @ApiOperation({ summary: 'Actualizar datos de un usuario' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente') // Solo Admin suspende cuentas
  @ApiOperation({ summary: 'Suspender una cuenta de usuario (Soft Delete)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string // 👈 Atrapamos solo el ID para la trazabilidad
  ) {
    return this.usuariosService.suspenderCuenta(id, adminId);
  }
}