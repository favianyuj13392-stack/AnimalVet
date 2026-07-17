import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InformeClinico, TipoInformeClinico, EstadoInformeClinico } from './entities/informe-clinico.entity';
import { Mascota } from '../../identidad/mascotas/entities/mascota.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { ExamenSolicitado, EstadoExamenSolicitado } from '../examenes_solicitados/entities/examen-solicitado.entity';
import { CreateInformeClinicoDto } from './dto/create-informe-clinico.dto';
import { ConfiguracionClinica } from '../../core/configuracion_clinica/entities/configuracion_clinica.entity';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

@Injectable()
export class InformesClinicosService {
  constructor(
    @InjectRepository(InformeClinico)
    private readonly informeRepo: Repository<InformeClinico>,
    @InjectRepository(Mascota)
    private readonly mascotaRepo: Repository<Mascota>,
    @InjectRepository(HistorialClinico)
    private readonly historialRepo: Repository<HistorialClinico>,
    @InjectRepository(ExamenSolicitado)
    private readonly examenRepo: Repository<ExamenSolicitado>,
    @InjectRepository(ConfiguracionClinica)
    private readonly configRepo: Repository<ConfiguracionClinica>,
  ) {}

  async crear(dto: CreateInformeClinicoDto, usuarioId: string): Promise<any> {
    const mascota = await this.mascotaRepo.findOne({
      where: { id: dto.id_mascota_fk },
    });
    if (!mascota) throw new NotFoundException('La mascota indicada no existe.');

    if (dto.id_historial_fk) {
      const historial = await this.historialRepo.findOne({
        where: { id: dto.id_historial_fk },
      });
      if (!historial) throw new NotFoundException('La consulta de referencia no existe.');
    }

    const nuevoInforme = this.informeRepo.create({
      idMascotaFk: dto.id_mascota_fk,
      idHistorialFk: dto.id_historial_fk || null,
      idSeguimientoFk: dto.id_seguimiento_fk || null,
      idHospitalizacionFk: dto.id_hospitalizacion_fk || null,
      tipo: dto.tipo,
      estado: dto.estado || EstadoInformeClinico.BORRADOR,
      titulo: dto.titulo,
      comentarioClinico: dto.comentario_clinico || null,
      conclusion: dto.conclusion || null,
      recomendaciones: dto.recomendaciones || null,
      imagenes: dto.imagenes || [],
      datosEstructurados: dto.datos_estructurados || null,
      veterinarioId: usuarioId,
      createdBy: usuarioId,
      updatedBy: usuarioId,
    });

    const guardado = await this.informeRepo.save(nuevoInforme);

    // Si hay un examen solicitado pendiente para esta consulta del mismo tipo, lo marcamos como REALIZADO
    if (dto.id_historial_fk) {
      const examenPendiente = await this.examenRepo.findOne({
        where: {
          idHistorialFk: dto.id_historial_fk,
          tipo: dto.tipo,
          estado: EstadoExamenSolicitado.SOLICITADO,
        },
      });

      if (examenPendiente) {
        examenPendiente.estado = EstadoExamenSolicitado.REALIZADO;
        examenPendiente.fechaRealizacion = new Date();
        examenPendiente.informeId = guardado.id;
        examenPendiente.updatedBy = usuarioId;
        await this.examenRepo.save(examenPendiente);
      }
    }

    return this.obtenerDetalle(guardado.id);
  }

  async obtenerDetalle(id: string): Promise<any> {
    const inf = await this.informeRepo.findOne({
      where: { id },
      relations: ['mascota', 'mascota.dueno', 'mascota.raza', 'mascota.raza.especie', 'veterinario'],
    });
    if (!inf) throw new NotFoundException('Informe clínico no encontrado.');
    return this.mapToDto(inf);
  }

  async listarPorMascota(idMascota: string): Promise<any[]> {
    const lista = await this.informeRepo.find({
      where: { idMascotaFk: idMascota },
      relations: ['veterinario'],
      order: { fecha: 'DESC' },
    });
    return lista.map((i) => this.mapToDto(i));
  }

  async listarPorConsulta(idHistorial: string): Promise<any[]> {
    const lista = await this.informeRepo.find({
      where: { idHistorialFk: idHistorial },
      relations: ['veterinario'],
      order: { fecha: 'DESC' },
    });
    return lista.map((i) => this.mapToDto(i));
  }

  private mapToDto(i: InformeClinico): any {
    return {
      id: i.id,
      id_mascota_fk: i.idMascotaFk,
      id_historial_fk: i.idHistorialFk,
      id_seguimiento_fk: i.idSeguimientoFk,
      id_hospitalizacion_fk: i.idHospitalizacionFk,
      tipo: i.tipo,
      estado: i.estado,
      titulo: i.titulo,
      comentario_clinico: i.comentarioClinico,
      conclusion: i.conclusion,
      recomendaciones: i.recomendaciones,
      fecha: i.fecha,
      veterinario: i.veterinario ? {
        id: i.veterinario.id,
        nombres: i.veterinario.nombres,
        apellidos: i.veterinario.apellidos,
        email: i.veterinario.email,
        numero_matricula: i.veterinario.numero_matricula,
      } : undefined,
      imagenes: i.imagenes,
      pdf_generado: i.pdfGenerado,
      datos_estructurados: i.datosEstructurados,
    };
  }

  // Generador de reporte en PDF
  async generarPdf(id: string): Promise<Buffer> {
    const inf = await this.informeRepo.findOne({
      where: { id },
      relations: ['mascota', 'mascota.dueno', 'mascota.raza', 'mascota.raza.especie', 'veterinario'],
    });
    if (!inf) throw new NotFoundException('Informe clínico no encontrado.');

    const configRows = await this.configRepo.find();
    const clinica = {
      nombreClinica: configRows.find(c => c.clave === 'nombre_clinica')?.valor || 'Animal Vet',
      clinicaSlogan: configRows.find(c => c.clave === 'clinica_slogan')?.valor || 'Estudios de Diagnóstico de Alta Complejidad',
      direccion: configRows.find(c => c.clave === 'direccion')?.valor || 'Av. Principal 123',
      telefono: configRows.find(c => c.clave === 'telefono')?.valor || '777-77777',
      email: configRows.find(c => c.clave === 'email')?.valor || 'contacto@animalvet.com',
      clinicaCiudad: configRows.find(c => c.clave === 'ciudad')?.valor || 'Santa Cruz',
    };

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const AZUL = '#1a3a5c';
      const GRIS = '#555555';
      const NEGRO = '#1a1a1a';
      const LINEA = '#dddddd';

      // Header Banner
      doc.rect(0, 0, doc.page.width, 80).fill(AZUL);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(22).text('ANIMAL VET', 40, 20);
      doc.fontSize(9).font('Helvetica-Oblique').text(clinica.clinicaSlogan || 'Estudios de Diagnóstico de Alta Complejidad', 40, 48);

      const fechaStr = new Date(inf.fecha).toLocaleDateString('es-BO', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      doc.fontSize(9).font('Helvetica').text(`Fecha de Estudio: ${fechaStr}`, 350, 25, { width: 200, align: 'right' });
      doc.text(`Informe N°: #${inf.id.slice(-8).toUpperCase()}`, 350, 40, { width: 200, align: 'right' });
      doc.text(`Tipo: ${inf.tipo}`, 350, 55, { width: 200, align: 'right' });

      let y = 100;

      // ── SECCIÓN 1: DATOS DEL PACIENTE ──
      doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(11).text('DATOS DEL PACIENTE Y PROPIETARIO', 40, y);
      y += 15;
      doc.moveTo(40, y).lineTo(550, y).strokeColor(AZUL).lineWidth(1).stroke();
      y += 8;

      const m = inf.mascota;
      const dueno = m?.dueno;
      doc.fillColor(NEGRO).font('Helvetica').fontSize(9);
      
      // Column 1
      doc.font('Helvetica-Bold').text('PACIENTE:', 40, y);
      doc.font('Helvetica').text(`Nombre: ${m?.nombre || '—'}`, 40, y + 14);
      doc.text(`Especie: ${m?.raza?.especie?.nombre || '—'}`, 40, y + 26);
      doc.text(`Raza: ${m?.raza?.nombre || '—'}`, 40, y + 38);
      doc.text(`Sexo: ${m?.sexo === 'M' ? 'Macho' : 'Hembra'}`, 40, y + 50);

      // Column 2
      doc.font('Helvetica-Bold').text('PROPIETARIO:', 300, y);
      doc.font('Helvetica').text(`Nombre: ${dueno ? `${dueno.nombres} ${dueno.apellidos}` : '—'}`, 300, y + 14);
      doc.text(`Email: ${dueno?.email || '—'}`, 300, y + 26);
      doc.text(`Teléfono: ${dueno?.telefono || '—'}`, 300, y + 38);

      y += 75;

      // ── SECCIÓN 2: TÍTULO Y DETALLE GENERAL ──
      doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(12).text(inf.titulo.toUpperCase(), 40, y, { align: 'center' });
      y += 25;

      // ── SECCIÓN 3: DATOS TÉCNICOS ESTRUCTURADOS ──
      if (inf.datosEstructurados && Object.keys(inf.datosEstructurados).length > 0) {
        doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(11).text('DETALLES TÉCNICOS Y PARÁMETROS', 40, y);
        y += 15;
        doc.moveTo(40, y).lineTo(550, y).strokeColor(AZUL).lineWidth(1).stroke();
        y += 8;

        doc.fillColor(NEGRO).font('Helvetica').fontSize(9);
        const data = inf.datosEstructurados;

        if (inf.tipo === TipoInformeClinico.ECOGRAFIA) {
          doc.font('Helvetica-Bold').text('Ecógrafo: ', 40, y, { continued: true }).font('Helvetica').text(data.ecografo || '—')
            .font('Helvetica-Bold').text('   Transductor: ', 200, y, { continued: true }).font('Helvetica').text(data.transductor || '—')
            .font('Helvetica-Bold').text('   Posición: ', 380, y, { continued: true }).font('Helvetica').text(data.posicion || '—');
          y += 24;

          if (data.organos) {
            doc.font('Helvetica-Bold').text('Hallazgos por Órganos:');
            y += 14;
            Object.entries(data.organos).forEach(([organo, hallazgo]) => {
              if (hallazgo) {
                const orgLabel = organo.charAt(0).toUpperCase() + organo.slice(1);
                doc.font('Helvetica-Bold').text(`• ${orgLabel}: `, 50, y, { continued: true }).font('Helvetica').text(hallazgo as string, { width: 490 });
                y += doc.heightOfString(`${orgLabel}: ${hallazgo as string}`, { width: 490 }) + 6;

                if (y > 700) { doc.addPage(); y = 40; }
              }
            });
          }
        } else if (inf.tipo === TipoInformeClinico.RADIOGRAFIA) {
          doc.font('Helvetica-Bold').text('Proyección: ', 40, y, { continued: true }).font('Helvetica').text(data.proyeccion || '—');
          y += 20;
          if (data.hallazgos) {
            doc.font('Helvetica-Bold').text('Hallazgos Radiográficos:');
            doc.font('Helvetica').text(data.hallazgos, 40, y + 12, { width: 510 });
            y += doc.heightOfString(data.hallazgos, { width: 510 }) + 20;
          }
        } else {
          // General key-value print for other formats
          Object.entries(data).forEach(([key, value]) => {
            const keyLabel = key.replace(/_/g, ' ').toUpperCase();
            doc.font('Helvetica-Bold').text(`${keyLabel}: `, 40, y, { continued: true }).font('Helvetica').text(String(value));
            y += 15;
            if (y > 700) { doc.addPage(); y = 40; }
          });
        }
        y += 10;
      }

      if (y > 700) { doc.addPage(); y = 40; }

      // ── SECCIÓN 4: COMENTARIO CLÍNICO ──
      if (inf.comentarioClinico) {
        doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(11).text('DESCRIPCIÓN Y COMENTARIO CLÍNICO', 40, y);
        y += 15;
        doc.moveTo(40, y).lineTo(550, y).strokeColor(AZUL).lineWidth(1).stroke();
        y += 8;

        doc.fillColor(NEGRO).font('Helvetica').fontSize(9);
        doc.text(inf.comentarioClinico, 40, y, { width: 510 });
        y += doc.heightOfString(inf.comentarioClinico, { width: 510 }) + 20;
      }

      if (y > 700) { doc.addPage(); y = 40; }

      // ── SECCIÓN 5: CONCLUSIÓN Y RECOMENDACIONES ──
      if (inf.conclusion || inf.recomendaciones) {
        doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(11).text('CONCLUSIONES Y RECOMENDACIONES', 40, y);
        y += 15;
        doc.moveTo(40, y).lineTo(550, y).strokeColor(AZUL).lineWidth(1).stroke();
        y += 8;

        doc.fillColor(NEGRO).font('Helvetica').fontSize(9);
        if (inf.conclusion) {
          doc.font('Helvetica-Bold').text('Conclusión:');
          doc.font('Helvetica').text(inf.conclusion, 40, y + 12, { width: 510 });
          y += doc.heightOfString(inf.conclusion, { width: 510 }) + 20;
        }

        if (inf.recomendaciones) {
          doc.font('Helvetica-Bold').text('Recomendaciones:');
          doc.font('Helvetica').text(inf.recomendaciones, 40, y + 12, { width: 510 });
          y += doc.heightOfString(inf.recomendaciones, { width: 510 }) + 20;
        }
      }

      // Footer/Signature
      y = Math.max(y + 20, doc.page.height - 130);
      doc.moveTo(350, y).lineTo(500, y).strokeColor(GRIS).lineWidth(0.75).stroke();
      doc.fillColor(NEGRO).font('Helvetica-Bold').fontSize(9)
        .text(`Dr(a). ${inf.veterinario?.nombres || ''} ${inf.veterinario?.apellidos || ''}`, 350, y + 5, { width: 150, align: 'center' });
      doc.font('Helvetica').fontSize(8).fillColor(GRIS)
        .text('Médico Veterinario Informante', 350, y + 17, { width: 150, align: 'center' });
      if (inf.veterinario?.numero_matricula) {
        doc.text(`Matrícula N°: ${inf.veterinario.numero_matricula}`, 350, y + 27, { width: 150, align: 'center' });
      }

      doc.fontSize(7).fillColor('#999999').text(`Este es un informe oficial emitido digitalmente por ${clinica.nombreClinica || 'Animal Vet'}.`, 40, doc.page.height - 30, { align: 'center', width: 510 });

      // ── SECCIÓN 6: ANEXO - IMÁGENES DEL ESTUDIO ──
      const renderAnexoYFinalizar = async () => {
        if (inf.imagenes && inf.imagenes.length > 0) {
          doc.addPage();
          doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(14).text('ANEXO: IMÁGENES DEL ESTUDIO', 40, 40, { align: 'center' });
          doc.moveTo(40, 60).lineTo(550, 60).strokeColor(AZUL).lineWidth(1.5).stroke();
          
          let currentY = 80;
          for (let i = 0; i < inf.imagenes.length; i++) {
            const url = inf.imagenes[i];
            let imageBuffer: Buffer | null = null;
            
            if (url.startsWith('data:image/')) {
              try {
                const base64Data = url.split(';base64,')[1];
                imageBuffer = Buffer.from(base64Data, 'base64');
              } catch (err) {
                console.error('Error decoding Base64 image:', err);
              }
            } else if (url.startsWith('http')) {
              try {
                const response = await fetch(url);
                if (response.ok) {
                  const arrayBuffer = await response.arrayBuffer();
                  imageBuffer = Buffer.from(arrayBuffer);
                }
              } catch (err) {
                console.error('Error downloading HTTP image:', err);
              }
            }
            
            if (imageBuffer) {
              if (currentY > 580) {
                doc.addPage();
                currentY = 40;
              }
              
              doc.fillColor(NEGRO).font('Helvetica-Bold').fontSize(10).text(`Captura ${i + 1}:`, 40, currentY);
              currentY += 15;
              
              try {
                doc.image(imageBuffer, 40, currentY, { fit: [510, 200], align: 'center' });
                currentY += 215;
              } catch (imageErr) {
                console.error('PDFKit error embedding image:', imageErr);
                doc.font('Helvetica-Oblique').fillColor('red').text('[Error: No se pudo renderizar esta imagen en el documento PDF]', 40, currentY);
                currentY += 25;
              }
            }
          }
        }
        doc.end();
      };

      void renderAnexoYFinalizar();
    });
  }
}
