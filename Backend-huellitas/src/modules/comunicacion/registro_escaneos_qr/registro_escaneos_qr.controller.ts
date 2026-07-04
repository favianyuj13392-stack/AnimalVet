import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Headers,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiParam, ApiBody, ApiResponse, ApiQuery,
} from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import { RegistroEscaneoQRService } from './registro_escaneos_qr.service';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';

class EscaneoPublicoDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitud?: number;
}

// ── Endpoints PÚBLICOS (sin JWT) ─────────────────────────────────────────────
@ApiTags('QR - Perfil Público')
@Controller('publico/mascotas')
export class RegistroEscaneoQRPublicoController {
  constructor(private readonly escaneoService: RegistroEscaneoQRService) {}

  @Get('perdidas')
  @ApiOperation({ summary: 'Listar mascotas con estado_perdido=true para la página pública' })
  @ApiResponse({ status: 200, description: 'Lista de mascotas extraviadas.' })
  listarPerdidas() {
    return this.escaneoService.listarMascotasPerdidas();
  }

  @Get('perfil/:hash')
  @ApiOperation({ summary: 'Ver perfil público de mascota escaneando su QR (HU-27)' })
  @ApiParam({ name: 'hash', description: 'Hash QR de la mascota' })
  @ApiResponse({ status: 200, description: 'Perfil público de la mascota.' })
  @ApiResponse({ status: 404, description: 'Mascota no encontrada.' })
  obtenerPerfil(@Param('hash') hash: string) {
    return this.escaneoService.obtenerPerfilPublico(hash);
  }

  @Post('escanear/:hash')
  @ApiOperation({ summary: 'Registrar escaneo de QR con geolocalización (HU-30)' })
  @ApiParam({ name: 'hash', description: 'Hash QR de la mascota' })
  @ApiBody({ type: EscaneoPublicoDto })
  @ApiResponse({ status: 201, description: 'Escaneo registrado. Si la mascota está perdida se notifica al dueño.' })
  registrarEscaneo(
    @Param('hash') hash: string,
    @Body() body: EscaneoPublicoDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.escaneoService.registrarEscaneo(
      hash,
      body.latitud,
      body.longitud,
      userAgent,
    );
  }
}

// ── Endpoints PROTEGIDOS (solo admin/vet) ────────────────────────────────────
@ApiTags('QR - Administración')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('escaneos-qr')
export class RegistroEscaneoQRController {
  constructor(private readonly escaneoService: RegistroEscaneoQRService) {}

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los escaneos de QR (Solo Administrador)' })
  @ApiResponse({ status: 200, description: 'Lista de escaneos.' })
  findAll() {
    return this.escaneoService.obtenerTodos();
  }

  @Get('mascota/:mascotaId')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar escaneos de QR de una mascota específica' })
  @ApiParam({ name: 'mascotaId', description: 'UUID de la mascota' })
  @ApiQuery({ name: 'mascotaId', required: true })
  findByMascota(@Param('mascotaId') mascotaId: string) {
    return this.escaneoService.obtenerPorMascota(mascotaId);
  }
}
