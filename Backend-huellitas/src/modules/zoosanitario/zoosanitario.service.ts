import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Desparasitacion } from './desparasitaciones/entities/desparasitacion.entity';
import { CirugiaRegistro } from './cirugias/entities/cirugia-registro.entity';
import { TratamientoZoosanitario } from './tratamientos-zoo/entities/tratamiento-zoo.entity';
import { ProgramaSanitarioItem } from './programa-sanitario/entities/programa-sanitario-item.entity';
import { VacunaAplicada } from '../clinica/vacunas_aplicadas/entities/vacunas_aplicada.entity';
import { Mascota } from '../identidad/mascotas/entities/mascota.entity';
import { CreateDesparasitacionDto } from './desparasitaciones/dto/create-desparasitacion.dto';
import { UpdateDesparasitacionDto } from './desparasitaciones/dto/update-desparasitacion.dto';
import { CreateCirugiaRegistroDto } from './cirugias/dto/create-cirugia-registro.dto';
import { UpdateCirugiaRegistroDto } from './cirugias/dto/update-cirugia-registro.dto';
import { CreateTratamientoZooDto } from './tratamientos-zoo/dto/create-tratamiento-zoo.dto';
import { UpdateTratamientoZooDto } from './tratamientos-zoo/dto/update-tratamiento-zoo.dto';
import { CreateProgramaSanitarioItemDto } from './programa-sanitario/dto/create-programa-sanitario-item.dto';
import { UpdateProgramaSanitarioItemDto } from './programa-sanitario/dto/update-programa-sanitario-item.dto';
import { VacunasAplicadasService } from '../clinica/vacunas_aplicadas/vacunas_aplicadas.service';
import { ConfiguracionClinica } from '../core/configuracion_clinica/entities/configuracion_clinica.entity';

@Injectable()
export class ZoosanitarioService {
  constructor(
    @InjectRepository(Desparasitacion)
    private readonly desparasitacionRepo: Repository<Desparasitacion>,
    @InjectRepository(CirugiaRegistro)
    private readonly cirugiaRepo: Repository<CirugiaRegistro>,
    @InjectRepository(TratamientoZoosanitario)
    private readonly tratamientoRepo: Repository<TratamientoZoosanitario>,
    @InjectRepository(ProgramaSanitarioItem)
    private readonly programaRepo: Repository<ProgramaSanitarioItem>,
    @InjectRepository(Mascota)
    private readonly mascotaRepo: Repository<Mascota>,
    @InjectRepository(ConfiguracionClinica)
    private readonly configRepo: Repository<ConfiguracionClinica>,
    private readonly vacunasService: VacunasAplicadasService,
    private readonly dataSource: DataSource,
  ) {}

  // Date Parsing Helpers
  private parseLocalDateAsUTCDate(dateString: string): Date {
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    }
    return new Date(dateString);
  }

  // --- CRUD DESPARASITACIONES ---
  async createDesparasitacion(dto: CreateDesparasitacionDto, creatorId: string) {
    const mascota = await this.mascotaRepo.findOne({ where: { id: dto.id_mascota_fk } });
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');

    const registro = this.desparasitacionRepo.create({
      id_mascota_fk: dto.id_mascota_fk,
      fecha: this.parseLocalDateAsUTCDate(dto.fecha),
      productoUtilizado: dto.producto_utilizado,
      id_producto_fk: dto.id_producto_fk || null,
      pesoKg: dto.peso_kg || null,
      fechaProxima: dto.fecha_proxima ? this.parseLocalDateAsUTCDate(dto.fecha_proxima) : null,
      id_veterinario_fk: dto.id_veterinario_fk || null,
      id_historial_fk: dto.id_historial_fk || null,
      notas: dto.notas || null,
      createdBy: creatorId,
    });

    const guardado = await this.desparasitacionRepo.save(registro);
    return this.findOneDesparasitacion(guardado.id);
  }

  async findDesparasitacionesByMascota(mascotaId: string) {
    const list = await this.desparasitacionRepo.find({
      where: { id_mascota_fk: mascotaId },
      relations: ['veterinario'],
      order: { fecha: 'DESC' },
    });
    return list.map(d => this.mapDesparasitacionToDto(d));
  }

  async findOneDesparasitacion(id: string) {
    const d = await this.desparasitacionRepo.findOne({
      where: { id },
      relations: ['veterinario'],
    });
    if (!d) throw new NotFoundException('Registro de desparasitación no encontrado.');
    return this.mapDesparasitacionToDto(d);
  }

  async updateDesparasitacion(id: string, dto: UpdateDesparasitacionDto) {
    const d = await this.desparasitacionRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Registro de desparasitación no encontrado.');

    if (dto.fecha !== undefined) d.fecha = this.parseLocalDateAsUTCDate(dto.fecha);
    if (dto.producto_utilizado !== undefined) d.productoUtilizado = dto.producto_utilizado;
    if (dto.peso_kg !== undefined) d.pesoKg = dto.peso_kg;
    if (dto.fecha_proxima !== undefined) d.fechaProxima = dto.fecha_proxima ? this.parseLocalDateAsUTCDate(dto.fecha_proxima) : null;
    if (dto.notas !== undefined) d.notas = dto.notas;

    await this.desparasitacionRepo.save(d);
    return this.findOneDesparasitacion(id);
  }

  async removeDesparasitacion(id: string) {
    const d = await this.desparasitacionRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Registro de desparasitación no encontrado.');
    await this.desparasitacionRepo.softRemove(d);
    return { mensaje: 'Registro de desparasitación eliminado.' };
  }

  private mapDesparasitacionToDto(d: Desparasitacion) {
    return {
      id: d.id,
      id_mascota_fk: d.id_mascota_fk,
      fecha: d.fecha,
      producto_utilizado: d.productoUtilizado,
      id_producto_fk: d.id_producto_fk,
      peso_kg: d.pesoKg ? Number(d.pesoKg) : null,
      fecha_proxima: d.fechaProxima,
      id_veterinario_fk: d.id_veterinario_fk,
      id_historial_fk: d.id_historial_fk,
      notas: d.notas,
      veterinario: d.veterinario ? {
        id: d.veterinario.id,
        nombres: d.veterinario.nombres,
        apellidos: d.veterinario.apellidos,
      } : null,
    };
  }

  // --- CRUD CIRUGIAS ---
  async createCirugia(dto: CreateCirugiaRegistroDto, creatorId: string) {
    const mascota = await this.mascotaRepo.findOne({ where: { id: dto.id_mascota_fk } });
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');

    const registro = this.cirugiaRepo.create({
      id_mascota_fk: dto.id_mascota_fk,
      fecha: this.parseLocalDateAsUTCDate(dto.fecha),
      tipoCirugia: dto.tipo_cirugia,
      observaciones: dto.observaciones || null,
      id_veterinario_fk: dto.id_veterinario_fk || null,
      id_historial_fk: dto.id_historial_fk || null,
      createdBy: creatorId,
    });

    const guardado = await this.cirugiaRepo.save(registro);
    return this.findOneCirugia(guardado.id);
  }

  async findCirugiasByMascota(mascotaId: string) {
    const list = await this.cirugiaRepo.find({
      where: { id_mascota_fk: mascotaId },
      relations: ['veterinario'],
      order: { fecha: 'DESC' },
    });
    return list.map(c => this.mapCirugiaToDto(c));
  }

  async findOneCirugia(id: string) {
    const c = await this.cirugiaRepo.findOne({
      where: { id },
      relations: ['veterinario'],
    });
    if (!c) throw new NotFoundException('Registro de cirugía no encontrado.');
    return this.mapCirugiaToDto(c);
  }

  async updateCirugia(id: string, dto: UpdateCirugiaRegistroDto) {
    const c = await this.cirugiaRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Registro de cirugía no encontrado.');

    if (dto.fecha !== undefined) c.fecha = this.parseLocalDateAsUTCDate(dto.fecha);
    if (dto.tipo_cirugia !== undefined) c.tipoCirugia = dto.tipo_cirugia;
    if (dto.observaciones !== undefined) c.observaciones = dto.observaciones;

    await this.cirugiaRepo.save(c);
    return this.findOneCirugia(id);
  }

  async removeCirugia(id: string) {
    const c = await this.cirugiaRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Registro de cirugía no encontrado.');
    await this.cirugiaRepo.softRemove(c);
    return { mensaje: 'Registro de cirugía eliminado.' };
  }

  private mapCirugiaToDto(c: CirugiaRegistro) {
    return {
      id: c.id,
      id_mascota_fk: c.id_mascota_fk,
      fecha: c.fecha,
      tipo_cirugia: c.tipoCirugia,
      observaciones: c.observaciones,
      id_veterinario_fk: c.id_veterinario_fk,
      id_historial_fk: c.id_historial_fk,
      veterinario: c.veterinario ? {
        id: c.veterinario.id,
        nombres: c.veterinario.nombres,
        apellidos: c.veterinario.apellidos,
      } : null,
    };
  }

  // --- CRUD TRATAMIENTOS LIBRES ---
  async createTratamiento(dto: CreateTratamientoZooDto, creatorId: string) {
    const mascota = await this.mascotaRepo.findOne({ where: { id: dto.id_mascota_fk } });
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');

    const registro = this.tratamientoRepo.create({
      id_mascota_fk: dto.id_mascota_fk,
      fecha: this.parseLocalDateAsUTCDate(dto.fecha),
      descripcion: dto.descripcion,
      id_veterinario_fk: dto.id_veterinario_fk || null,
      id_historial_fk: dto.id_historial_fk || null,
      createdBy: creatorId,
    });

    const guardado = await this.tratamientoRepo.save(registro);
    return this.findOneTratamiento(guardado.id);
  }

  async findTratamientosByMascota(mascotaId: string) {
    const list = await this.tratamientoRepo.find({
      where: { id_mascota_fk: mascotaId },
      relations: ['veterinario'],
      order: { fecha: 'DESC' },
    });
    return list.map(t => this.mapTratamientoToDto(t));
  }

  async findOneTratamiento(id: string) {
    const t = await this.tratamientoRepo.findOne({
      where: { id },
      relations: ['veterinario'],
    });
    if (!t) throw new NotFoundException('Registro de tratamiento no encontrado.');
    return this.mapTratamientoToDto(t);
  }

  async updateTratamiento(id: string, dto: UpdateTratamientoZooDto) {
    const t = await this.tratamientoRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Registro de tratamiento no encontrado.');

    if (dto.fecha !== undefined) t.fecha = this.parseLocalDateAsUTCDate(dto.fecha);
    if (dto.descripcion !== undefined) t.descripcion = dto.descripcion;

    await this.tratamientoRepo.save(t);
    return this.findOneTratamiento(id);
  }

  async removeTratamiento(id: string) {
    const t = await this.tratamientoRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Registro de tratamiento no encontrado.');
    await this.tratamientoRepo.softRemove(t);
    return { mensaje: 'Registro de tratamiento eliminado.' };
  }

  private mapTratamientoToDto(t: TratamientoZoosanitario) {
    return {
      id: t.id,
      id_mascota_fk: t.id_mascota_fk,
      fecha: t.fecha,
      descripcion: t.descripcion,
      id_veterinario_fk: t.id_veterinario_fk,
      id_historial_fk: t.id_historial_fk,
      veterinario: t.veterinario ? {
        id: t.veterinario.id,
        nombres: t.veterinario.nombres,
        apellidos: t.veterinario.apellidos,
      } : null,
    };
  }

  // --- CRUD CONFIGURACIÓN PROGRAMA SANITARIO ---
  async createProgramaItem(dto: CreateProgramaSanitarioItemDto, creatorId: string) {
    const item = this.programaRepo.create({
      especie: dto.especie,
      edadTexto: dto.edad_texto,
      edadDiasDesde: dto.edad_dias_desde ?? null,
      edadDiasHasta: dto.edad_dias_hasta ?? null,
      detalle: dto.detalle,
      observaciones: dto.observaciones ?? null,
      orden: dto.orden ?? 0,
      createdBy: creatorId,
    });
    return this.programaRepo.save(item);
  }

  async findAllProgramaItems(especie?: string) {
    const whereClause: any = {};
    if (especie) whereClause.especie = especie;
    return this.programaRepo.find({
      where: whereClause,
      order: { orden: 'ASC', id: 'ASC' },
    });
  }

  async findOneProgramaItem(id: number) {
    const item = await this.programaRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Ítem de programa sanitario no encontrado.');
    return item;
  }

  async updateProgramaItem(id: number, dto: UpdateProgramaSanitarioItemDto, updaterId: string) {
    const item = await this.findOneProgramaItem(id);

    if (dto.especie !== undefined) item.especie = dto.especie;
    if (dto.edad_texto !== undefined) item.edadTexto = dto.edad_texto;
    if (dto.edad_dias_desde !== undefined) item.edadDiasDesde = dto.edad_dias_desde;
    if (dto.edad_dias_hasta !== undefined) item.edadDiasHasta = dto.edad_dias_hasta;
    if (dto.detalle !== undefined) item.detalle = dto.detalle;
    if (dto.observaciones !== undefined) item.observaciones = dto.observaciones;
    if (dto.orden !== undefined) item.orden = dto.orden;
    if (dto.activo !== undefined) item.activo = dto.activo;
    item.updatedBy = updaterId;

    return this.programaRepo.save(item);
  }

  async removeProgramaItem(id: number) {
    const item = await this.findOneProgramaItem(id);
    await this.programaRepo.softRemove(item);
    return { mensaje: 'Ítem de programa sanitario eliminado.' };
  }

  // --- FACADE ZOOSANITARIO CARD ---
  async obtenerTarjetaControl(mascotaId: string) {
    const mascota = await this.mascotaRepo.findOne({
      where: { id: mascotaId },
      relations: ['raza', 'raza.especie', 'dueno'],
    });
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');

    const vacunas = await this.vacunasService.findByMascota(mascotaId);
    const desparasitaciones = await this.findDesparasitacionesByMascota(mascotaId);
    const cirugias = await this.findCirugiasByMascota(mascotaId);
    const tratamientos = await this.findTratamientosByMascota(mascotaId);

    const alertas = await this.calcularAlertas(mascota, vacunas, desparasitaciones);

    return {
      mascota: {
        id: mascota.id,
        nombre: mascota.nombre,
        fecha_nacimiento: mascota.fecha_nacimiento,
        sexo: mascota.sexo,
        color: mascota.color,
        esterilizado: mascota.esterilizado,
        especie: mascota.raza?.especie?.nombre || 'Desconocida',
        raza: mascota.raza?.nombre || 'Desconocida',
        dueno: mascota.dueno ? {
          id: mascota.dueno.id,
          nombres: mascota.dueno.nombres,
          apellidos: mascota.dueno.apellidos,
          telefono: mascota.dueno.telefono,
          domicilio: mascota.dueno.domicilio,
        } : null,
      },
      vacunaciones: vacunas,
      desparasitaciones,
      cirugias,
      tratamientos_libres: tratamientos,
      alertas,
    };
  }

  // --- SUGGESTIONS & ALERTS ENGINE ---
  private calcularEdadEnDias(fechaNacimiento: Date): number {
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    const diffTime = Math.abs(hoy.getTime() - nacimiento.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async calcularAlertas(mascota: Mascota, vacunasAplicadas: any[], desparasitaciones: any[]) {
    if (!mascota.fecha_nacimiento) return [];

    const edadDias = this.calcularEdadEnDias(mascota.fecha_nacimiento);
    const especieNombre = mascota.raza?.especie?.nombre || '';
    const especieNormalizada = especieNombre.toLowerCase().includes('gato') || especieNombre.toLowerCase().includes('felin') ? 'Felino' : 'Canino';

    // Obtener catálogo preventivo para la especie
    const programaItems = await this.programaRepo.find({
      where: { especie: especieNormalizada, activo: true },
      order: { orden: 'ASC' },
    });

    const alertas: any[] = [];
    const hoy = new Date();

    // 1. Validar ítems pendientes del Programa Sanitario
    for (const item of programaItems) {
      const desde = item.edadDiasDesde || 0;
      const hasta = item.edadDiasHasta || 99999;

      if (edadDias >= desde) {
        // Buscar si ya se realizó este procedimiento
        const yaRealizado = this.itemEstaRegistrado(item.detalle, vacunasAplicadas, desparasitaciones);

        if (!yaRealizado) {
          alertas.push({
            tipo: 'PROGRAMA_PENDIENTE',
            mensaje: `Procedimiento sugerido para la edad de ${item.edadTexto}: ${item.detalle}`,
            edad_texto: item.edadTexto,
            detalle: item.detalle,
            observaciones: item.observaciones,
            prioridad: edadDias > hasta ? 'ALTA' : 'MEDIA',
          });
        }
      }
    }

    // 2. Alertas de refuerzo de vacunas aplicadas
    for (const v of vacunasAplicadas) {
      if (v.fecha_proxima_dosis) {
        const proxima = new Date(v.fecha_proxima_dosis);
        const diffTime = proxima.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alertas.push({
            tipo: 'VACUNA_VENCIDA',
            mensaje: `La vacuna ${v.vacuna?.nombre || 'General'} está vencida desde el ${new Date(v.fecha_proxima_dosis).toISOString().split('T')[0]}.`,
            fecha_vencimiento: v.fecha_proxima_dosis,
            vacuna_nombre: v.vacuna?.nombre || 'General',
            prioridad: 'ALTA',
          });
        } else if (diffDays <= 7) {
          alertas.push({
            tipo: 'VACUNA_PROXIMA',
            mensaje: `Corresponde refuerzo de vacuna ${v.vacuna?.nombre || 'General'} el ${new Date(v.fecha_proxima_dosis).toISOString().split('T')[0]} (en ${diffDays} días).`,
            fecha_vencimiento: v.fecha_proxima_dosis,
            vacuna_nombre: v.vacuna?.nombre || 'General',
            prioridad: 'MEDIA',
          });
        }
      }
    }

    // 3. Alertas de vencimiento de desparasitaciones
    for (const d of desparasitaciones) {
      if (d.fecha_proxima) {
        const proxima = new Date(d.fecha_proxima);
        const diffTime = proxima.getTime() - hoy.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          alertas.push({
            tipo: 'DESPARASITACION_VENCIDA',
            mensaje: `Próxima desparasitación vencida desde el ${d.fecha_proxima.toISOString().split('T')[0]}.`,
            fecha_vencimiento: d.fecha_proxima,
            producto: d.producto_utilizado,
            prioridad: 'ALTA',
          });
        } else if (diffDays <= 7) {
          alertas.push({
            tipo: 'DESPARASITACION_PROXIMA',
            mensaje: `Corresponde próxima desparasitación el ${d.fecha_proxima.toISOString().split('T')[0]} (en ${diffDays} días).`,
            fecha_vencimiento: d.fecha_proxima,
            producto: d.producto_utilizado,
            prioridad: 'MEDIA',
          });
        }
      }
    }

    return alertas;
  }

  private itemEstaRegistrado(detalle: string, vacunas: any[], desparasitaciones: any[]): boolean {
    const dLower = detalle.toLowerCase();
    
    // Check vaccines
    for (const v of vacunas) {
      const vName = (v.vacuna?.nombre || '').toLowerCase();
      if (dLower.includes(vName) || vName.includes(dLower)) return true;
    }

    // Check deworming
    for (const d of desparasitaciones) {
      const pName = (d.producto_utilizado || '').toLowerCase();
      if (dLower.includes(pName) || pName.includes(dLower) || dLower.includes('desparasit') || dLower.includes('parasit')) return true;
    }

    return false;
  }

  // --- PDF GENERATION ---
  async generarPdf(mascotaId: string): Promise<Buffer> {
    const cardData = await this.obtenerTarjetaControl(mascotaId);

    // Fetch clinical configs
    const configs = await this.configRepo.find();
    const clinicaConfig = {
      nombre_clinica: 'AnimalVet',
      clinica_slogan: 'Cuidado profesional para tus mascotas',
      clinica_ciudad: '',
      nit: '',
      direccion: 'Dirección de la Clínica',
      telefono: '',
      email: '',
    };
    for (const c of configs) {
      clinicaConfig[c.clave] = c.valor;
    }

    const PDFDocument = require('pdfkit');

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const AZUL = '#1a3a5c';
      const BORDER = '#e2e8f0';
      const NEGRO = '#1a202c';
      const GRIS = '#4a5568';
      const GRIS_CLARO = '#f7fafc';

      // --- HEADER BAND ---
      doc.rect(0, 0, doc.page.width, 95).fill(AZUL);
      doc.fillColor('white')
        .fontSize(22).font('Helvetica-Bold')
        .text(clinicaConfig.nombre_clinica.toUpperCase(), 40, 20);
      doc.fontSize(9).font('Helvetica-Oblique')
        .text(clinicaConfig.clinica_slogan, 40, 45);
      
      const direccionCompleta = clinicaConfig.clinica_ciudad 
        ? `${clinicaConfig.direccion} — ${clinicaConfig.clinica_ciudad}` 
        : clinicaConfig.direccion;
      doc.fontSize(9).font('Helvetica')
        .text(direccionCompleta, 40, 60)
        .text(`Tel: ${clinicaConfig.telefono}  |  Email: ${clinicaConfig.email}`, 40, 72);

      const hoyStr = new Date().toLocaleDateString('es-BO', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
      doc.fontSize(9).text(`Fecha Emisión: ${hoyStr}`, 380, 25, { width: 175, align: 'right' });
      doc.fontSize(10).font('Helvetica-Bold').text(`CARNET ZOOSANITARIO`, 380, 42, { width: 175, align: 'right' });
      doc.fontSize(8).font('Helvetica').text(`ID Mascota: ${cardData.mascota.id.slice(-8).toUpperCase()}`, 380, 58, { width: 175, align: 'right' });

      doc.fillColor(NEGRO);
      let y = 115;

      // --- SECCIÓN: DATOS DE LA MASCOTA ---
      doc.fontSize(12).font('Helvetica-Bold').fillColor(AZUL).text('DATOS DE LA MASCOTA', 40, y);
      y += 15;
      doc.moveTo(40, y).lineTo(555, y).strokeColor(AZUL).lineWidth(1).stroke();
      y += 10;

      // Draw background box for mascot details
      doc.rect(40, y, 515, 65).fill(GRIS_CLARO);
      doc.fillColor(NEGRO).font('Helvetica').fontSize(9);

      const m = cardData.mascota;
      const nacimientoStr = m.fecha_nacimiento 
        ? new Date(m.fecha_nacimiento).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'N/A';

      doc.text(`Nombre: ${m.nombre}`, 50, y + 10);
      doc.text(`Especie: ${m.especie}`, 50, y + 22);
      doc.text(`Raza: ${m.raza}`, 50, y + 34);
      doc.text(`Color: ${m.color || 'N/A'}`, 50, y + 46);

      doc.text(`F. Nacimiento: ${nacimientoStr}`, 210, y + 10);
      doc.text(`Sexo: ${m.sexo === 'M' ? 'Macho' : 'Hembra'}`, 210, y + 22);
      doc.text(`Esterilizado: ${m.esterilizado ? 'Sí' : 'No'}`, 210, y + 34);

      if (m.dueno) {
        doc.text(`Propietario: ${m.dueno.nombres} ${m.dueno.apellidos}`, 370, y + 10);
        doc.text(`Teléfono: ${m.dueno.telefono || 'N/A'}`, 370, y + 22);
        doc.text(`Dirección: ${m.dueno.domicilio || 'N/A'}`, 370, y + 34, { width: 170 });
      }
      y += 85;

      // Helper to check page break
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > 780) {
          doc.addPage();
          doc.rect(0, 0, doc.page.width, 40).fill(AZUL);
          doc.fillColor('white').fontSize(10).font('Helvetica-Bold').text(`Carnet Zoosanitario - ${m.nombre}`, 40, 15);
          y = 60;
          doc.fillColor(NEGRO);
        }
      };

      // --- SECCIÓN: VACUNACIONES ---
      checkPageBreak(120);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(AZUL).text('CALENDARIO DE VACUNACIONES', 40, y);
      y += 15;
      doc.moveTo(40, y).lineTo(555, y).strokeColor(AZUL).lineWidth(1).stroke();
      y += 10;

      // Table Header
      doc.rect(40, y, 515, 20).fill(AZUL);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(8);
      doc.text('Fecha', 45, y + 6);
      doc.text('Vacuna / Inmunización', 125, y + 6);
      doc.text('Peso (kg)', 320, y + 6);
      doc.text('Lote', 380, y + 6);
      doc.text('Refuerzo', 440, y + 6);
      doc.text('Médico', 500, y + 6);
      y += 20;

      doc.fillColor(NEGRO).font('Helvetica').fontSize(8);
      if (cardData.vacunaciones.length === 0) {
        doc.rect(40, y, 515, 20).strokeColor(BORDER).stroke();
        doc.text('No se registran vacunas aplicadas.', 45, y + 6, { align: 'center', width: 505 });
        y += 20;
      } else {
        for (const v of cardData.vacunaciones) {
          checkPageBreak(30);
          doc.rect(40, y, 515, 20).strokeColor(BORDER).stroke();
          const fAplicacion = new Date(v.fecha_aplicacion).toLocaleDateString('es-BO');
          const fProxima = v.fecha_proxima_dosis 
            ? new Date(v.fecha_proxima_dosis).toLocaleDateString('es-BO')
            : 'N/A';

          doc.text(fAplicacion, 45, y + 6);
          doc.text(v.vacuna?.nombre || 'General', 125, y + 6, { width: 190 });
          doc.text(v.peso_mascota_kg ? `${v.peso_mascota_kg} kg` : 'N/A', 320, y + 6);
          doc.text(v.lote_vacuna || 'N/A', 380, y + 6);
          doc.text(fProxima, 440, y + 6);
          
          const doctorName = v.veterinario 
            ? `${v.veterinario.nombres.split(' ')[0]} ${v.veterinario.apellidos.split(' ')[0]}`
            : 'N/A';
          doc.text(doctorName, 500, y + 6, { width: 50 });
          y += 20;
        }
      }
      y += 15;

      // --- SECCIÓN: DESPARASITACIONES ---
      checkPageBreak(120);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(AZUL).text('DESPARASITACIONES', 40, y);
      y += 15;
      doc.moveTo(40, y).lineTo(555, y).strokeColor(AZUL).lineWidth(1).stroke();
      y += 10;

      // Table Header
      doc.rect(40, y, 515, 20).fill(AZUL);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(8);
      doc.text('Fecha', 45, y + 6);
      doc.text('Producto Utilizado', 125, y + 6);
      doc.text('Peso (kg)', 340, y + 6);
      doc.text('Próxima Dosis', 400, y + 6);
      doc.text('Notas / Veterinario', 470, y + 6);
      y += 20;

      doc.fillColor(NEGRO).font('Helvetica').fontSize(8);
      if (cardData.desparasitaciones.length === 0) {
        doc.rect(40, y, 515, 20).strokeColor(BORDER).stroke();
        doc.text('No se registran tratamientos antiparasitarios.', 45, y + 6, { align: 'center', width: 505 });
        y += 20;
      } else {
        for (const d of cardData.desparasitaciones) {
          checkPageBreak(30);
          doc.rect(40, y, 515, 20).strokeColor(BORDER).stroke();
          const fDeworm = new Date(d.fecha).toLocaleDateString('es-BO');
          const fNext = d.fecha_proxima 
            ? new Date(d.fecha_proxima).toLocaleDateString('es-BO')
            : 'N/A';

          doc.text(fDeworm, 45, y + 6);
          doc.text(d.producto_utilizado, 125, y + 6, { width: 200 });
          doc.text(d.peso_kg ? `${d.peso_kg} kg` : 'N/A', 340, y + 6);
          doc.text(fNext, 400, y + 6);

          const docName = d.veterinario 
            ? `${d.veterinario.nombres.split(' ')[0]} ${d.veterinario.apellidos.split(' ')[0]}`
            : 'N/A';
          doc.text(docName, 470, y + 6, { width: 80 });
          y += 20;
        }
      }
      y += 15;

      // --- SECCIÓN: CIRUGÍAS ---
      checkPageBreak(100);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(AZUL).text('CIRUGÍAS Y EVENTOS QUIRÚRGICOS', 40, y);
      y += 15;
      doc.moveTo(40, y).lineTo(555, y).strokeColor(AZUL).lineWidth(1).stroke();
      y += 10;

      if (cardData.cirugias.length === 0) {
        doc.rect(40, y, 515, 20).strokeColor(BORDER).stroke();
        doc.fontSize(8).fillColor(GRIS).text('No se registran procedimientos quirúrgicos históricos.', 45, y + 6, { align: 'center', width: 505 });
        y += 35;
      } else {
        for (const c of cardData.cirugias) {
          checkPageBreak(50);
          const fCir = new Date(c.fecha).toLocaleDateString('es-BO');
          
          doc.rect(40, y, 515, 35).fill(GRIS_CLARO);
          doc.rect(40, y, 515, 35).strokeColor(BORDER).stroke();

          doc.fontSize(8).font('Helvetica-Bold').fillColor(AZUL).text(c.tipo_cirugia.toUpperCase(), 45, y + 6);
          doc.font('Helvetica').fillColor(NEGRO).text(`Fecha: ${fCir}`, 45, y + 18);
          
          if (c.observaciones) {
            doc.text(`Obs: ${c.observaciones}`, 150, y + 6, { width: 300, height: 25 });
          }
          if (c.veterinario) {
            doc.text(`Vet: ${c.veterinario.nombres} ${c.veterinario.apellidos}`, 450, y + 6, { width: 100 });
          }
          y += 40;
        }
      }
      y += 15;

      // --- SECCIÓN: OTROS TRATAMIENTOS ---
      checkPageBreak(100);
      doc.fontSize(12).font('Helvetica-Bold').fillColor(AZUL).text('OTROS TRATAMIENTOS (LÍNEA DE TIEMPO)', 40, y);
      y += 15;
      doc.moveTo(40, y).lineTo(555, y).strokeColor(AZUL).lineWidth(1).stroke();
      y += 15;

      if (cardData.tratamientos_libres.length === 0) {
        doc.rect(40, y, 515, 20).strokeColor(BORDER).stroke();
        doc.fontSize(8).fillColor(GRIS).text('No se registran otros tratamientos preventivos.', 45, y + 6, { align: 'center', width: 505 });
        y += 20;
      } else {
        doc.font('Helvetica').fontSize(8).fillColor(NEGRO);
        for (const t of cardData.tratamientos_libres) {
          checkPageBreak(40);
          const fTrat = new Date(t.fecha).toLocaleDateString('es-BO');
          
          // Draw Timeline vertical guide and bullet
          doc.moveTo(110, y).lineTo(110, y + 30).strokeColor(BORDER).lineWidth(1).stroke();
          doc.circle(110, y + 8, 3).fill(AZUL);

          doc.font('Helvetica-Bold').fillColor(AZUL).text(fTrat, 40, y + 5);
          doc.font('Helvetica').fillColor(NEGRO).text(t.descripcion, 125, y + 5, { width: 420 });
          y += 30;
        }
      }

      // --- FOOTER ON ALL PAGES ---
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).fillColor(GRIS)
          .text(
            `Este documento es un extracto zoosanitario y preventivo de la mascota. No sustituye un diagnóstico o tratamiento médico formal.`,
            40,
            810,
            { align: 'center', width: 515 }
          )
          .text(`Página ${i + 1} de ${pageCount}`, 40, 820, { align: 'center', width: 515 });
      }

      doc.end();
    });
  }
}

