// src/modules/clinica/recetas/recetas.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receta } from './entities/receta.entity';
import { DetallesReceta } from '../detalles_receta/entities/detalles_receta.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { Usuario } from '../../identidad/usuarios/entities/usuario.entity';
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { ConfiguracionClinica } from '../../core/configuracion_clinica/entities/configuracion_clinica.entity';
import { CreateRecetaDto } from './dto/create-recetas.dto';
import { UpdateRecetaDto } from './dto/update-receta.dto';
import { RecetasResponseDto } from './dto/recetas-response.dto';

@Injectable()
export class RecetasService {
  constructor(
    @InjectRepository(Receta)
    private readonly recetaRepo: Repository<Receta>,
    @InjectRepository(DetallesReceta)
    private readonly detalleRepo: Repository<DetallesReceta>,
    @InjectRepository(HistorialClinico)
    private readonly historialRepo: Repository<HistorialClinico>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectRepository(ConfiguracionClinica)
    private readonly configRepo: Repository<ConfiguracionClinica>,
  ) {}

  private mapToResponse(r: Receta): RecetasResponseDto {
    return {
      id: r.id,
      id_historial_fk: r.idHistorialFk,
      indicaciones_grales: r.indicacionesGrales,
      veterinario: r.veterinario ? {
        id: r.veterinario.id,
        nombres: r.veterinario.nombres,
        apellidos: r.veterinario.apellidos,
        email: r.veterinario.email,
        numero_matricula: r.veterinario.numero_matricula ?? null,
      } : undefined,
      detalles: r.detalles ? r.detalles.map(d => ({
        id: d.id,
        medicamento_texto: d.medicamentoTexto ?? undefined,
        dosis: d.dosis,
        frecuencia: d.frecuencia,
        duracion_dias: d.duracionDias ?? undefined,
        producto: d.producto ? {
          id: d.producto.id,
          nombre: d.producto.nombre,
        } : undefined,
      })) : [],
    };
  }

  private async findEntity(id: string): Promise<Receta> {
    const receta = await this.recetaRepo.findOne({
      where: { id },
      relations: [
        'detalles',
        'detalles.producto',
        'veterinario',
        'historial',
      ],
    });
    if (!receta) throw new NotFoundException('Receta no encontrada.');
    return receta;
  }

  /**
   * Crear una receta médica con sus detalles.
   * Solo Veterinario y Administrador pueden crear recetas.
   */
  async crear(
    dto: CreateRecetaDto,
    creatorId: string,
    creatorRol: string,
  ): Promise<RecetasResponseDto> {
    // 1. Verificar que el creador tenga rol adecuado
    if (!['Veterinario', 'Administrador'].includes(creatorRol)) {
      throw new ForbiddenException(
        'Solo los veterinarios y administradores pueden crear recetas.',
      );
    }

    // 2. Verificar historial clínico
    const historial = await this.historialRepo.findOne({
      where: { id: dto.id_historial },
    });
    if (!historial) {
      throw new NotFoundException('Historial clínico no encontrado.');
    }
    if (historial.estado !== 'Abierto') {
      throw new BadRequestException(
        'Solo se pueden crear recetas en historiales abiertos.',
      );
    }

    // 3. Determinar veterinario responsable (token vs DTO)
    let idVeterinario = creatorId;
    if (dto.id_veterinario) {
      const vet = await this.usuarioRepo.findOne({
        where: { id: dto.id_veterinario },
        relations: ['rol'],
      });
      if (!vet) throw new NotFoundException('Veterinario no encontrado.');
      if (vet.rol.nombre !== 'Veterinario' && vet.rol.nombre !== 'Administrador') {
        throw new BadRequestException('El usuario asignado no es veterinario.');
      }
      idVeterinario = dto.id_veterinario;
    }

    // 4. Crear cabecera (relación de auditoría como en UsuariosService)
    const nuevaReceta = this.recetaRepo.create({
      idHistorialFk: dto.id_historial,
      idVeterinarioFk: idVeterinario,
      historial: { id: dto.id_historial },
      veterinario: { id: idVeterinario },
      indicacionesGrales: dto.indicaciones_grales,
      createdBy: creatorId,
      createdByUser: { id: creatorId },
    });

    const recetaGuardada = await this.recetaRepo.save(nuevaReceta);

    // 5. Crear detalles si vienen
    if (dto.detalles && dto.detalles.length > 0) {
      // Validar existencia de todos los productos primero
      for (const detDto of dto.detalles) {
        if (detDto.id_producto) {
          const prod = await this.productoRepo.findOne({
            where: { id: detDto.id_producto },
          });
          if (!prod) {
            throw new BadRequestException(
              `El producto con ID ${detDto.id_producto} no existe en el catálogo.`,
            );
          }
        } else {
          // Dado que id_producto_fk es NOT NULL en la base de datos física,
          // no podemos permitir prescripción sin producto catálogo.
          throw new BadRequestException(
            'El id_producto es obligatorio para cada detalle de receta debido a restricciones de la base de datos.',
          );
        }
      }

      const detalles = dto.detalles.map((detDto) => {
        return this.detalleRepo.create({
          idRecetaFk: recetaGuardada.id,
          idProductoFk: detDto.id_producto,
          medicamentoTexto: detDto.medicamento_texto || null,
          dosis: detDto.dosis,
          frecuencia: detDto.frecuencia,
          duracionDias: detDto.duracion_dias ?? null,
          createdBy: creatorId,
          createdByUser: { id: creatorId },
        } as DetallesReceta);
      });
      await this.detalleRepo.save(detalles);
    }
    // 6. Retornar receta completa con relaciones
    return this.obtenerPorId(recetaGuardada.id);
  }

  async obtenerPorId(id: string): Promise<RecetasResponseDto> {
    const entity = await this.findEntity(id);
    return this.mapToResponse(entity);
  }

  async obtenerPorHistorial(idHistorial: string): Promise<RecetasResponseDto[]> {
    const recetas = await this.recetaRepo.find({
      where: { historial: { id: idHistorial } },
      relations: ['detalles', 'detalles.producto', 'veterinario'],
      order: { createdAt: 'DESC' },
    });
    return recetas.map(r => this.mapToResponse(r));
  }

  async actualizar(id: string, dto: UpdateRecetaDto): Promise<RecetasResponseDto> {
    const receta = await this.findEntity(id);
    if (receta.historial && (receta.historial.estado === 'Cerrado' || receta.historial.estado === 'Facturado')) {
      throw new BadRequestException('La receta está congelada porque la consulta médica ya fue finalizada/cerrada.');
    }
    if (dto.indicaciones_grales !== undefined) {
      receta.indicacionesGrales = dto.indicaciones_grales;
    }
    const guardada = await this.recetaRepo.save(receta);
    return this.obtenerPorId(guardada.id);
  }

  async eliminar(id: string): Promise<{ mensaje: string }> {
    const receta = await this.findEntity(id);
    if (receta.historial && (receta.historial.estado === 'Cerrado' || receta.historial.estado === 'Facturado')) {
      throw new BadRequestException('La receta está congelada porque la consulta médica ya fue finalizada/cerrada.');
    }
    await this.recetaRepo.softDelete(id);
    return { mensaje: 'Receta eliminada correctamente.' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RF-09 | HU-08 — Generar PDF de receta médica digital
  // ─────────────────────────────────────────────────────────────────────────
  async generarPdf(id: string): Promise<Buffer> {
    const datos = await this.obtenerFormatoImpresion(id);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const AZUL    = '#1a3a5c';
      const GRIS    = '#666666';
      const LINEA   = '#dddddd';
      const NEGRO   = '#1a1a1a';
      const VERDE   = '#2e7d32';

      // ── Cabecera clínica ──────────────────────────────────────────────
      doc.rect(0, 0, doc.page.width, 90).fill(AZUL);
      const slogan = datos.clinica.clinica_slogan ?? '';
      const ciudad = datos.clinica.clinica_ciudad ?? '';
      const direccionCompleta = ciudad
        ? `${datos.clinica.direccion ?? ''} — ${ciudad}`
        : (datos.clinica.direccion ?? '');

      doc.fillColor('white')
        .fontSize(20).font('Helvetica-Bold')
        .text(datos.clinica.nombre_clinica ?? 'Huellitas Digitales', 50, 20);
      if (slogan) {
        doc.fontSize(9).font('Helvetica-Oblique')
          .text(slogan, 50, 44);
      }
      doc.fontSize(10).font('Helvetica')
        .text(direccionCompleta, 50, slogan ? 56 : 48)
        .text(`Tel: ${datos.clinica.telefono ?? ''}   |   ${datos.clinica.email ?? ''}`, 50, slogan ? 69 : 63);

      const fechaStr = new Date(datos.fecha).toLocaleDateString('es-BO', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      doc.fontSize(9).text(`Fecha: ${fechaStr}`, 380, 48, { width: 165, align: 'right' });
      doc.text(`Receta N°: ${id.slice(-8).toUpperCase()}`, 380, 63, { width: 165, align: 'right' });

      doc.fillColor(NEGRO);
      let y = 110;

      // ── Datos del paciente ────────────────────────────────────────────
      doc.fontSize(12).font('Helvetica-Bold').fillColor(AZUL)
        .text('DATOS DEL PACIENTE', 50, y);
      y += 18;
      doc.moveTo(50, y).lineTo(545, y).strokeColor(AZUL).lineWidth(1.5).stroke();
      y += 10;

      const p = datos.paciente;
      if (p) {
        doc.fontSize(10).font('Helvetica').fillColor(NEGRO);
        doc.text(`Nombre:`, 50, y, { continued: true }).font('Helvetica-Bold').text(` ${p.nombre}`, { continued: true });
        doc.font('Helvetica').text(`   Especie/Raza: ${p.especie} / ${p.raza}`, { align: 'left' });
        y += 16;
        doc.text(`Sexo: ${p.sexo}   Edad: ${p.edad}   Esterilizado: ${p.esterilizado ? 'Sí' : 'No'}`, 50, y);
        y += 16;
        if (p.dueno) {
          doc.text(`Propietario:`, 50, y, { continued: true })
            .font('Helvetica-Bold').text(` ${p.dueno.nombres} ${p.dueno.apellidos}`, { continued: true });
          doc.font('Helvetica').text(`   Tel: ${p.dueno.telefono ?? 'N/A'}`, { continued: true });
          doc.text(`   Email: ${p.dueno.email}`, { align: 'left' });
          y += 16;
        }
      }
      y += 8;

      // ── Medicamentos prescritos ───────────────────────────────────────
      doc.fontSize(12).font('Helvetica-Bold').fillColor(AZUL)
        .text('MEDICAMENTOS PRESCRITOS', 50, y);
      y += 18;
      doc.moveTo(50, y).lineTo(545, y).strokeColor(AZUL).lineWidth(1.5).stroke();
      y += 10;

      // Encabezados de tabla
      doc.fontSize(9).font('Helvetica-Bold').fillColor('white');
      doc.rect(50, y, 495, 20).fill(AZUL);
      doc.text('Medicamento',          60, y + 5, { width: 180 });
      doc.text('Dosis',                240, y + 5, { width: 90 });
      doc.text('Frecuencia',           330, y + 5, { width: 100 });
      doc.text('Duración',             430, y + 5, { width: 70 });
      y += 20;

      doc.fillColor(NEGRO).font('Helvetica').fontSize(9);
      (datos.detalles as any[]).forEach((d, i) => {
        if (i % 2 === 0) doc.rect(50, y, 495, 18).fill('#f5f5f5');
        doc.fillColor(NEGRO)
          .text(d.producto_nombre, 60, y + 4, { width: 175 })
          .text(d.dosis,           240, y + 4, { width: 85 })
          .text(d.frecuencia,      330, y + 4, { width: 95 })
          .text(d.duracion_dias ? `${d.duracion_dias} día(s)` : '—', 430, y + 4, { width: 65 });
        y += 18;
      });

      doc.moveTo(50, y).lineTo(545, y).strokeColor(LINEA).lineWidth(0.5).stroke();
      y += 14;

      // ── Indicaciones generales ────────────────────────────────────────
      if (datos.indicaciones_grales) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor(AZUL)
          .text('INDICACIONES GENERALES', 50, y);
        y += 16;
        doc.fontSize(10).font('Helvetica').fillColor(NEGRO)
          .text(datos.indicaciones_grales, 50, y, { width: 495 });
        y += doc.heightOfString(datos.indicaciones_grales, { width: 495 }) + 14;
      }

      // ── Firma veterinario ─────────────────────────────────────────────
      y = Math.max(y, doc.page.height - 160);
      doc.moveTo(50, y).lineTo(545, y).strokeColor(LINEA).lineWidth(0.5).stroke();
      y += 16;

      if (datos.veterinario) {
        doc.fontSize(9).font('Helvetica').fillColor(GRIS)
          .text('Firma y sello del Médico Veterinario:', 50, y);
        y += 40;
        doc.moveTo(50, y).lineTo(220, y).strokeColor(NEGRO).lineWidth(0.5).stroke();
        y += 6;
        doc.fontSize(9).font('Helvetica-Bold').fillColor(NEGRO)
          .text(`Dr(a). ${datos.veterinario.nombres} ${datos.veterinario.apellidos}`, 50, y);
        y += 14;
        doc.font('Helvetica').fillColor(GRIS).fontSize(8)
          .text('Médico Veterinario - Huellitas Digitales', 50, y);
        if (datos.veterinario.numero_matricula) {
          y += 12;
          doc.font('Helvetica').fillColor(GRIS).fontSize(8)
            .text(`Matrícula Prof.: ${datos.veterinario.numero_matricula}`, 50, y);
        }
      }

      // ── Pie de página ─────────────────────────────────────────────────
      doc.fontSize(7).fillColor(GRIS)
        .text(
          'Este documento es una receta médica digital emitida por Huellitas Digitales. Válida únicamente con sello del veterinario.',
          50, doc.page.height - 30, { align: 'center', width: 495 },
        );

      doc.end();
    });
  }

  async obtenerFormatoImpresion(id: string): Promise<any> {
    const receta = await this.recetaRepo.findOne({
      where: { id },
      relations: [
        'detalles',
        'detalles.producto',
        'veterinario',
        'historial',
        'historial.expediente',
        'historial.expediente.mascota',
        'historial.expediente.mascota.raza',
        'historial.expediente.mascota.raza.especie',
        'historial.expediente.mascota.dueno',
      ],
    });

    if (!receta) {
      throw new NotFoundException('Receta no encontrada.');
    }

    // Fetch clinical configs
    const configs = await this.configRepo.find();
    const clinicaConfig = {
      nombre_clinica: 'Huellitas Digitales',
      clinica_slogan: '',
      clinica_ciudad: '',
      nit: '123456789',
      direccion: 'Av. Banzer Nro 456, Santa Cruz, Bolivia',
      telefono: '76543210',
      email: 'contacto@huellitas.local',
    };
    for (const c of configs) {
      clinicaConfig[c.clave] = c.valor;
    }

    const mascota = receta.historial?.expediente?.mascota;
    const dueno = mascota?.dueno;

    // Calculate age
    let edad = 'Desconocida';
    if (mascota?.fecha_nacimiento) {
      const nacimiento = new Date(mascota.fecha_nacimiento);
      const hoy = new Date();
      let anios = hoy.getFullYear() - nacimiento.getFullYear();
      let meses = hoy.getMonth() - nacimiento.getMonth();
      if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
        anios--;
        meses += 12;
      }
      if (anios === 0) {
        edad = `${meses} mes(es)`;
      } else {
        edad = `${anios} año(s) y ${meses} mes(es)`;
      }
    }

    return {
      id: receta.id,
      fecha: receta.createdAt,
      indicaciones_grales: receta.indicacionesGrales,
      veterinario: receta.veterinario ? {
        id: receta.veterinario.id,
        nombres: receta.veterinario.nombres,
        apellidos: receta.veterinario.apellidos,
        email: receta.veterinario.email,
        telefono: receta.veterinario.telefono ?? undefined,
        numero_matricula: receta.veterinario.numero_matricula ?? null,
      } : undefined,
      paciente: mascota ? {
        id: mascota.id,
        nombre: mascota.nombre,
        fecha_nacimiento: mascota.fecha_nacimiento,
        sexo: mascota.sexo,
        esterilizado: mascota.esterilizado,
        edad: edad,
        especie: mascota.raza?.especie?.nombre ?? 'Desconocida',
        raza: mascota.raza?.nombre ?? 'Desconocida',
        dueno: dueno ? {
          nombres: dueno.nombres,
          apellidos: dueno.apellidos,
          telefono: dueno.telefono ?? undefined,
          email: dueno.email,
        } : undefined,
      } : undefined,
      detalles: receta.detalles ? receta.detalles.map(d => ({
        id: d.id,
        producto_nombre: d.producto ? d.producto.nombre : (d.medicamentoTexto ?? 'Medicamento'),
        dosis: d.dosis,
        frecuencia: d.frecuencia,
        duracion_dias: d.duracionDias ?? undefined,
      })) : [],
      clinica: clinicaConfig,
    };
  }
}