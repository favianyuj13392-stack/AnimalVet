import { Controller, Post, Get, Body, Param, UseGuards, Req, ParseUUIDPipe, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../identidad/auth/guards/jwt.guard';
import { RolesGuard } from '../../identidad/auth/guards/roles.guard';
import { Roles } from '../../identidad/auth/decorators/roles.decorator';
import { InformesClinicosService } from './informes_clinicos.service';
import { CreateInformeClinicoDto } from './dto/create-informe-clinico.dto';

@ApiTags('Informes Clínicos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('informes-clinicos')
export class InformesClinicosController {
  constructor(private readonly informesService: InformesClinicosService) {}

  @Post()
  @Roles('Administrador', 'Veterinario')
  @ApiOperation({ summary: 'Registrar un nuevo informe clínico estructurado' })
  crear(@Body() dto: CreateInformeClinicoDto, @Req() req: any) {
    return this.informesService.crear(dto, req.user.id);
  }

  @Get('mascota/:idMascota')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los informes diagnósticos de una mascota' })
  listarPorMascota(@Param('idMascota', ParseUUIDPipe) idMascota: string) {
    return this.informesService.listarPorMascota(idMascota);
  }

  @Get('historial/:idHistorial')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Listar todos los informes diagnósticos asociados a una consulta clínica' })
  listarPorConsulta(@Param('idHistorial', ParseUUIDPipe) idHistorial: string) {
    return this.informesService.listarPorConsulta(idHistorial);
  }

  @Get(':id')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @ApiOperation({ summary: 'Obtener el detalle estructurado de un informe diagnóstico' })
  obtenerDetalle(@Param('id', ParseUUIDPipe) id: string) {
    return this.informesService.obtenerDetalle(id);
  }

  @Get(':id/pdf')
  @Roles('Administrador', 'Veterinario', 'Cajero', 'Cliente')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Generar y descargar el informe diagnóstico estructurado en PDF' })
  async descargarPdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const buffer = await this.informesService.generarPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="informe-${id.slice(-8)}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
