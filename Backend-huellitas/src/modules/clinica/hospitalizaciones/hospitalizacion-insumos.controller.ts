import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HospitalizacionInsumosService } from './hospitalizacion-insumos.service';
import { CreateHospitalizacionInsumoDto } from './dto/create-hospitalizacion-insumo.dto';
// Importa tus guards de autenticación (ejemplo: JwtAuthGuard)
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
@ApiTags('Hospitalizaciones - Insumos')
@Controller('hospitalizaciones-insumos')
@UseGuards(JwtAuthGuard) // 👈 Descomenta esto según tu sistema de auth
export class HospitalizacionInsumosController {
  constructor(private readonly insumosService: HospitalizacionInsumosService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un producto o servicio consumido en una hospitalización' })
  @ApiResponse({ status: 201, description: 'Insumo registrado y stock descontado' })
  async registrarInsumo(
    @Body() createDto: CreateHospitalizacionInsumoDto,
    @Req() req: any
  ) {
    // Obtiene el ID del usuario que está haciendo la petición desde el token
    const usuarioId = req.user?.id; 
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.insumosService.registrarInsumo(createDto, usuarioId);
  }
}