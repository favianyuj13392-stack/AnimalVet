import {
  Controller, Post, Body, Get, Param, ParseUUIDPipe, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExpedienteClinicoService } from './expediente_clinico.service';
import { CreateExpedienteClinicoDto } from './dto/create-expediente_clinico.dto';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { ExpedienteClinicoResponseDto } from './dto/expediente_clinico-response.dto';

@ApiTags('Expediente Clínico')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expediente-clinico')
export class ExpedienteClinicoController {
  constructor(private readonly expedienteService: ExpedienteClinicoService) {}

  @Post()
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Abrir un nuevo expediente clínico para una mascota' })
  @ApiResponse({ status: 201, description: 'Expediente abierto exitosamente.', type: ExpedienteClinicoResponseDto })
  @ApiResponse({ status: 409, description: 'La mascota ya tiene un expediente.' })
  create(@Body() dto: CreateExpedienteClinicoDto, @Req() req: any): Promise<ExpedienteClinicoResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.expedienteService.create(dto, req.user.id);
  }

  @Get('mascota/:idMascota')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Consultar el expediente por ID de mascota' })
  @ApiResponse({ status: 200, description: 'Expediente encontrado.', type: ExpedienteClinicoResponseDto })
  @ApiResponse({ status: 404, description: 'Expediente no encontrado.' })
  findByMascota(
    @Param('idMascota', ParseUUIDPipe) idMascota: string,
  ): Promise<ExpedienteClinicoResponseDto> {
    return this.expedienteService.findByMascota(idMascota);
  }

  @Get()
  @Roles('Administrador', 'Veterinario', 'Cajero')
  @ApiOperation({ summary: 'Listar todos los expedientes (Vista Administrativa — sin acceso para Cliente)' })
  @ApiResponse({ status: 200, description: 'Lista de expedientes.', type: [ExpedienteClinicoResponseDto] })
  findAll(): Promise<ExpedienteClinicoResponseDto[]> {
    return this.expedienteService.findAll();
  }
}