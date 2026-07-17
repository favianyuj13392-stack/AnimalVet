import { Controller, Post, Get, Body, Param, UseGuards, Req, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { ExamenesSolicitadosService } from './examenes_solicitados.service';
import { CreateExamenSolicitadoDto } from './dto/create-examen-solicitado.dto';
import { EstadoExamenSolicitado } from './entities/examen-solicitado.entity';

@ApiTags('Exámenes Solicitados')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('examenes-solicitados')
export class ExamenesSolicitadosController {
  constructor(private readonly examenesService: ExamenesSolicitadosService) {}

  @Post()
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Registrar un nuevo examen solicitado (Solo Vet/Admin)' })
  crear(@Body() dto: CreateExamenSolicitadoDto, @Req() req: any) {
    return this.examenesService.crear(dto, req.user.id);
  }

  @Get('historial/:idHistorial')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los exámenes solicitados de una consulta' })
  listarPorConsulta(@Param('idHistorial', ParseUUIDPipe) idHistorial: string) {
    return this.examenesService.listarPorConsulta(idHistorial);
  }

  @Patch(':id/estado')
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Actualizar el estado de un examen solicitado' })
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('estado') estado: EstadoExamenSolicitado,
    @Req() req: any,
  ) {
    return this.examenesService.cambiarEstado(id, estado, req.user.id);
  }
}
