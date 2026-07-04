import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { LogsSistemaService } from '../../core/logs_sistema/logs_sistema.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import { CreateDetalleVentaProductoDto, CreateTransaccionesCajaDto } from './dto/create-transacciones_caja.dto';
import { CreateCobroClinicoDto } from './dto/create-cobro-clinico.dto';
import { TransaccionCaja } from './entities/transacciones_caja.entity';
import { DetalleTransaccion } from '../detalles_transaccion/entities/detalles_transaccion.entity';
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { LoteCaducidad } from '../../inventario/lotes_caducidad/entities/lotes_caducidad.entity';
import { KardexInventario } from '../../inventario/kardex_inventario/entities/kardex_inventario.entity';
import { Servicio } from '../../core/servicios/entities/servicio.entity';
import { HistorialClinico } from '../../clinica/historial_clinico/entities/historial_clinico.entity';
import { Hospitalizacion } from '../../clinica/hospitalizaciones/entities/hospitalizacione.entity';
import { ConfiguracionClinica } from '../../core/configuracion_clinica/entities/configuracion_clinica.entity';

type LineaPreparada = {
  dto: CreateDetalleVentaProductoDto;
  precioUnitario: number;
  subtotalLinea: number;
  producto?: Producto;
  lotesConsumo: Array<{ lote: LoteCaducidad; cantidad: number }>;
  descontarStock: boolean;
};

type CobroClinicoLinea = {
  tipo_cobro?: 'previo' | 'entrega';
  id_producto_fk?: string;
  id_servicio_fk?: number;
  id_receta_fk?: string;
  id_lote_fk?: string;
  cantidad: number;
  precio_unitario?: number;
  descontar_stock?: boolean;
};

type CobroClinicoInput = Omit<CreateTransaccionesCajaDto, 'detalles'> & {
  id_historial_fk?: string;
  id_hospitalizacion_fk?: string;
  detalles: CobroClinicoLinea[];
};

@Injectable()
export class TransaccionesCajaService {
  constructor(
    @InjectRepository(TransaccionCaja)
    private readonly transaccionRepo: Repository<TransaccionCaja>,
    @InjectRepository(ConfiguracionClinica)
    private readonly configRepo: Repository<ConfiguracionClinica>,
    private readonly dataSource: DataSource,
    private readonly logsService: LogsSistemaService,
  ) {}

  private async obtenerDescuentoMaxPct(): Promise<number> {
    const config = await this.configRepo.findOne({ where: { clave: 'descuento_maximo_porcentaje' } });
    if (!config) return 0;
    const pct = parseFloat(config.valor);
    return isNaN(pct) ? 0 : Math.max(0, Math.min(100, pct));
  }

  private async validarYAplicarDescuento(subtotal: number, descuentoSolicitado: number): Promise<number> {
    if (descuentoSolicitado <= 0) return 0;
    const maxPct = await this.obtenerDescuentoMaxPct();
    const maxMonto = this.roundMoney(subtotal * maxPct / 100);
    if (descuentoSolicitado > maxMonto) {
      throw new BadRequestException(
        `El descuento solicitado (${descuentoSolicitado} Bs.) supera el máximo permitido de ${maxPct}% (${maxMonto} Bs.).`,
      );
    }
    return this.roundMoney(descuentoSolicitado);
  }

  async create(createDto: CreateTransaccionesCajaDto, cajeroId: string): Promise<TransaccionCaja> {
    if (!createDto.detalles?.length) {
      throw new BadRequestException('La venta debe incluir al menos un detalle.');
    }

    return this.dataSource.transaction(async (manager) => {
      const transaccionRepo = manager.getRepository(TransaccionCaja);
      const detalleRepo = manager.getRepository(DetalleTransaccion);
      const productoRepo = manager.getRepository(Producto);
      const loteRepo = manager.getRepository(LoteCaducidad);
      const kardexRepo = manager.getRepository(KardexInventario);

      const lineas: LineaPreparada[] = [];

      for (const detalle of createDto.detalles) {
        const producto = await productoRepo.findOne({
          where: { id: detalle.id_producto_fk },
          lock: { mode: 'pessimistic_write' },
        });
        if (!producto) {
          throw new NotFoundException('Uno de los productos de la venta no existe.');
        }
        if (producto.requiereReceta) {
          throw new BadRequestException(`"${producto.nombre}" requiere receta médica y no puede venderse directamente en caja.`);
        }
        if (Number(producto.stockActual) < detalle.cantidad) {
          throw new BadRequestException(`Stock insuficiente para ${producto.nombre}.`);
        }

        const precioUnitario = detalle.precio_unitario ?? Number(producto.precioVenta);
        const lotesConsumo = await this.reservarLotes(loteRepo, producto.id, detalle.cantidad, detalle.id_lote_fk);
        lineas.push({
          dto: detalle,
          precioUnitario,
          subtotalLinea: this.roundMoney(precioUnitario * detalle.cantidad),
          producto,
          lotesConsumo,
          descontarStock: true,
        });
      }

      const subtotal = this.roundMoney(lineas.reduce((acc, item) => acc + item.subtotalLinea, 0));
      const descuento = await this.validarYAplicarDescuento(subtotal, createDto.descuento ?? 0);

      const nuevaTransaccion = new TransaccionCaja();
      nuevaTransaccion.id_cajero_fk = cajeroId;
      nuevaTransaccion.id_cliente_fk = createDto.id_cliente_fk ?? null;
      nuevaTransaccion.id_historial_fk = null;
      nuevaTransaccion.id_hospitalizacion_fk = null;
      nuevaTransaccion.subtotal = subtotal;
      nuevaTransaccion.descuento = descuento;
      nuevaTransaccion.totalCobrado = this.roundMoney(subtotal - descuento);
      nuevaTransaccion.metodoPago = createDto.metodo_pago;
      nuevaTransaccion.estadoTransaccion = 'Completada';
      nuevaTransaccion.turno = createDto.turno ?? null;
      nuevaTransaccion.createdBy = cajeroId;
      nuevaTransaccion.updatedBy = cajeroId;
      const transaccion = await transaccionRepo.save(nuevaTransaccion);

      for (const linea of lineas) {
        if (linea.producto && linea.descontarStock) {
          linea.producto.stockActual = Number(linea.producto.stockActual) - linea.dto.cantidad;
          linea.producto.updatedBy = cajeroId;
          await productoRepo.save(linea.producto);

          for (const consumo of linea.lotesConsumo) {
            consumo.lote.cantidadActual = Number(consumo.lote.cantidadActual) - consumo.cantidad;
            consumo.lote.updatedBy = cajeroId;
            await loteRepo.save(consumo.lote);
          }

          await kardexRepo.save(kardexRepo.create({
            idProductoFk: linea.producto.id,
            idUsuarioFk: cajeroId,
            tipoMovimiento: 'Salida_Venta',
            cantidad: linea.dto.cantidad,
            saldoResultante: linea.producto.stockActual,
            motivoDetalle: `Venta POS ${transaccion.id}`,
            idLoteFk: linea.lotesConsumo.length === 1 ? linea.lotesConsumo[0].lote.id : null,
            idTransaccionFk: transaccion.id,
            idHistorialFk: null,
            createdBy: cajeroId,
          }));
        }

        const nuevoDetalle = new DetalleTransaccion();
        nuevoDetalle.id_transaccion_fk = transaccion.id;
        nuevoDetalle.id_producto_fk = linea.dto.id_producto_fk;
        nuevoDetalle.id_servicio_fk = null;
        nuevoDetalle.id_receta_fk = null;
        nuevoDetalle.id_lote_fk = linea.lotesConsumo.length === 1 ? linea.lotesConsumo[0].lote.id : (linea.dto.id_lote_fk ?? null);
        nuevoDetalle.cantidad = linea.dto.cantidad;
        nuevoDetalle.precioUnitario = linea.precioUnitario;
        nuevoDetalle.subtotalLinea = linea.subtotalLinea;
        nuevoDetalle.tipo_cobro = 'entrega';
        nuevoDetalle.createdBy = cajeroId;
        nuevoDetalle.updatedBy = cajeroId;
        await detalleRepo.save(nuevoDetalle);
      }

      await this.logsService.registrar({
        usuarioId: cajeroId,
        accion: 'VENTA_MOSTRADOR_CREADA',
        categoria: 'FINANZAS',
        tablaAfectada: 'transacciones_caja',
        registroId: transaccion.id,
        detalles: { total: transaccion.totalCobrado, metodo: transaccion.metodoPago },
      });

      return this.findOneWithManager(transaccion.id, manager);
    });
  }

  async createDesdeHistorial(idHistorial: string, dto: CreateCobroClinicoDto, cajeroId: string): Promise<TransaccionCaja> {
    const historialRepo = this.transaccionRepo.manager.getRepository(HistorialClinico);
    const servicioRepo = this.transaccionRepo.manager.getRepository(Servicio);

    const historial = await historialRepo.findOne({
      where: { id: idHistorial },
      relations: [
        'cita',
        'cita.servicio',
        'expediente',
        'expediente.mascota',
        'expediente.mascota.dueno',
        'recetas',
        'recetas.detalles',
        'recetas.detalles.producto',
        'vacunasAplicadas',
        'vacunasAplicadas.vacuna',
        'vacunasAplicadas.vacuna.producto',
      ],
    });
    if (!historial) {
      throw new NotFoundException('El historial clinico no existe.');
    }

    const existente = await this.transaccionRepo.findOne({
      where: { id_historial_fk: idHistorial, estadoTransaccion: 'Completada' },
    });
    if (existente) {
      throw new BadRequestException('Este historial ya tiene una transaccion completada.');
    }
    if (historial.estado === 'Facturado') {
      throw new BadRequestException('Este historial ya esta facturado.');
    }
    if (historial.estado !== 'Cerrado') {
      throw new BadRequestException('El historial debe estar Cerrado antes de enviarse a caja.');
    }

    const detalles: CobroClinicoLinea[] = [];

    if (historial.cita?.servicio) {
      detalles.push({
        tipo_cobro: 'previo',
        id_servicio_fk: historial.cita.servicio.id,
        cantidad: 1,
        precio_unitario: Number(historial.cita.servicio.precio),
      });
    }

    for (const receta of historial.recetas ?? []) {
      for (const detalle of receta.detalles ?? []) {
        if (detalle.producto) {
          detalles.push({
            tipo_cobro: 'entrega',
            id_producto_fk: detalle.producto.id,
            id_receta_fk: receta.id,
            cantidad: 1,
            precio_unitario: Number(detalle.producto.precioVenta),
            descontar_stock: false,
          });
        }
      }
    }

    const servicioVacunacion = dto.id_servicio_vacunacion_fk
      ? await servicioRepo.findOne({ where: { id: dto.id_servicio_vacunacion_fk } })
      : null;
    if (dto.id_servicio_vacunacion_fk && !servicioVacunacion) {
      throw new NotFoundException('El servicio de vacunacion indicado no existe.');
    }

    for (const vacunaAplicada of historial.vacunasAplicadas ?? []) {
      if (servicioVacunacion) {
        detalles.push({
          tipo_cobro: 'previo',
          id_servicio_fk: servicioVacunacion.id,
          cantidad: 1,
          precio_unitario: Number(servicioVacunacion.precio),
        });
      }
      const productoVacuna = vacunaAplicada.vacuna?.producto;
      if ((dto.cobrar_producto_vacuna ?? true) && productoVacuna) {
        detalles.push({
          tipo_cobro: 'entrega',
          id_producto_fk: productoVacuna.id,
          cantidad: 1,
          precio_unitario: Number(productoVacuna.precioVenta),
          descontar_stock: false,
        });
      }
    }

    return this.createClinico(
      {
        metodo_pago: dto.metodo_pago,
        turno: dto.turno,
        descuento: dto.descuento,
        id_cliente_fk: historial.expediente?.mascota?.id_dueno_fk,
        id_historial_fk: idHistorial,
        detalles,
      },
      cajeroId,
    );
  }

  async createDesdeHospitalizacion(idHospitalizacion: string, dto: CreateCobroClinicoDto, cajeroId: string): Promise<TransaccionCaja> {
    const hospitalizacionRepo = this.transaccionRepo.manager.getRepository(Hospitalizacion);
    const servicioRepo = this.transaccionRepo.manager.getRepository(Servicio);

    const hospitalizacion = await hospitalizacionRepo.findOne({
      where: { id: idHospitalizacion },
      relations: [
        'mascota',
        'mascota.dueno',
        'insumos',
        'insumos.producto',
        'insumos.servicio',
        'vacunasAplicadas',
        'vacunasAplicadas.vacuna',
        'vacunasAplicadas.vacuna.producto',
      ],
    });
    if (!hospitalizacion) {
      throw new NotFoundException('La hospitalizacion no existe.');
    }

    const existente = await this.transaccionRepo.findOne({
      where: { id_hospitalizacion_fk: idHospitalizacion, estadoTransaccion: 'Completada' },
    });
    if (existente) {
      throw new BadRequestException('Esta hospitalizacion ya tiene una transaccion completada.');
    }
    if (hospitalizacion.estadoActual !== 'Alta' || !hospitalizacion.fechaAlta) {
      throw new BadRequestException('La hospitalizacion solo se puede cobrar cuando el paciente este dado de alta.');
    }

    const detalles: CobroClinicoLinea[] = [];
    const dias = this.calcularDiasHospitalizacion(hospitalizacion.fechaIngreso, hospitalizacion.fechaAlta);
    if (Number(hospitalizacion.costoPorDia) > 0) {
      if (dto.id_servicio_hospitalizacion_fk) {
        const servicioHospitalizacion = await servicioRepo.findOne({ where: { id: dto.id_servicio_hospitalizacion_fk } });
        if (!servicioHospitalizacion) {
          throw new NotFoundException('El servicio de hospitalizacion indicado no existe.');
        }
        detalles.push({
          tipo_cobro: 'previo',
          id_servicio_fk: servicioHospitalizacion.id,
          cantidad: dias,
          precio_unitario: Number(hospitalizacion.costoPorDia),
        });
      } else {
        // Sin servicio vinculado — se registra el costo directamente
        detalles.push({
          tipo_cobro: 'previo',
          cantidad: dias,
          precio_unitario: Number(hospitalizacion.costoPorDia),
        });
      }
    }

    for (const insumo of hospitalizacion.insumos ?? []) {
      if (insumo.producto) {
        detalles.push({
          tipo_cobro: 'entrega',
          id_producto_fk: insumo.producto.id,
          cantidad: insumo.cantidad,
          precio_unitario: Number(insumo.producto.precioVenta),
          descontar_stock: false,
        });
      } else if (insumo.servicio) {
        detalles.push({
          tipo_cobro: 'previo',
          id_servicio_fk: insumo.servicio.id,
          cantidad: insumo.cantidad,
          precio_unitario: Number(insumo.servicio.precio),
        });
      }
    }

    const servicioVacunacion = dto.id_servicio_vacunacion_fk
      ? await servicioRepo.findOne({ where: { id: dto.id_servicio_vacunacion_fk } })
      : null;
    if (dto.id_servicio_vacunacion_fk && !servicioVacunacion) {
      throw new NotFoundException('El servicio de vacunacion indicado no existe.');
    }

    for (const vacunaAplicada of hospitalizacion.vacunasAplicadas ?? []) {
      if (servicioVacunacion) {
        detalles.push({
          tipo_cobro: 'previo',
          id_servicio_fk: servicioVacunacion.id,
          cantidad: 1,
          precio_unitario: Number(servicioVacunacion.precio),
        });
      }
      const productoVacuna = vacunaAplicada.vacuna?.producto;
      if ((dto.cobrar_producto_vacuna ?? true) && productoVacuna) {
        detalles.push({
          tipo_cobro: 'entrega',
          id_producto_fk: productoVacuna.id,
          cantidad: 1,
          precio_unitario: Number(productoVacuna.precioVenta),
          descontar_stock: false,
        });
      }
    }

    return this.createClinico(
      {
        metodo_pago: dto.metodo_pago,
        turno: dto.turno,
        descuento: dto.descuento,
        id_cliente_fk: hospitalizacion.mascota?.id_dueno_fk,
        id_hospitalizacion_fk: idHospitalizacion,
        detalles,
      },
      cajeroId,
    );
  }

  async findAll(filtros?: { cajeroId?: string; clienteId?: string; fecha?: string; estado?: string }): Promise<TransaccionCaja[]> {
    const where: any = {};
    if (filtros?.cajeroId) where.id_cajero_fk = filtros.cajeroId;
    if (filtros?.clienteId) where.id_cliente_fk = filtros.clienteId;
    if (filtros?.estado) where.estadoTransaccion = filtros.estado;
    if (filtros?.fecha) {
      const d = filtros.fecha.includes('T') ? filtros.fecha.split('T')[0] : filtros.fecha;
      where.fechaTransaccion = Between(
        new Date(`${d}T00:00:00.000-04:00`),
        new Date(`${d}T23:59:59.999-04:00`),
      );
    }
    return this.transaccionRepo.find({
      where,
      relations: ['cajero', 'cliente', 'historial', 'hospitalizacion'],
      order: { fechaTransaccion: 'DESC' },
    });
  }

  async generarComprobante(id: string): Promise<Buffer> {
    const tx = await this.transaccionRepo.findOne({
      where: { id },
      relations: ['cajero', 'cliente', 'detalles', 'detalles.producto', 'detalles.servicio'],
    });
    if (!tx) throw new NotFoundException('La transaccion no existe.');

    const config = await this.configRepo.findOne({ where: { clave: 'nombre_clinica' } });
    const nombreClinica = config?.valor ?? 'Animal Vet';

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A5' });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const AZUL = '#1a3a5c';
      const GRIS = '#666666';
      const NEGRO = '#1a1a1a';

      // Cabecera
      doc.rect(0, 0, doc.page.width, 70).fill(AZUL);
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
        .text(nombreClinica, 50, 18);
      doc.fontSize(8).font('Helvetica')
        .text('COMPROBANTE DE VENTA', 50, 40);
      doc.text(`N°: ${id.slice(-8).toUpperCase()}`, 50, 52);

      doc.fillColor(NEGRO);
      let y = 90;

      // Fecha y cajero
      const fecha = new Date(tx.fechaTransaccion ?? tx.createdAt).toLocaleString('es-BO', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      doc.fontSize(9).font('Helvetica').fillColor(GRIS).text(`Fecha: ${fecha}`, 50, y);
      y += 14;
      if (tx.cajero) {
        doc.text(`Cajero: ${tx.cajero.nombres} ${tx.cajero.apellidos}`, 50, y);
        y += 14;
      }
      if (tx.cliente) {
        doc.text(`Cliente: ${tx.cliente.nombres} ${tx.cliente.apellidos}`, 50, y);
        y += 14;
      }
      doc.text(`Método de pago: ${tx.metodoPago}`, 50, y);
      y += 20;

      // Línea separadora
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor(AZUL).lineWidth(1).stroke();
      y += 10;

      // Encabezado de tabla
      doc.fillColor(AZUL).fontSize(8).font('Helvetica-Bold')
        .text('CONCEPTO', 50, y)
        .text('CANT', 270, y, { width: 40, align: 'right' })
        .text('P.UNIT', 315, y, { width: 60, align: 'right' })
        .text('SUBTOTAL', 380, y, { width: 65, align: 'right' });
      y += 14;
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#dddddd').lineWidth(0.5).stroke();
      y += 6;

      // Detalles
      doc.fillColor(NEGRO).font('Helvetica').fontSize(8);
      for (const det of tx.detalles ?? []) {
        const nombre = det.producto?.nombre ?? det.servicio?.nombre ?? 'Ítem';
        const sub = this.roundMoney(Number(det.precioUnitario) * det.cantidad);
        doc.text(nombre, 50, y, { width: 215, ellipsis: true })
          .text(String(det.cantidad), 270, y, { width: 40, align: 'right' })
          .text(`${Number(det.precioUnitario).toFixed(2)} Bs`, 315, y, { width: 60, align: 'right' })
          .text(`${sub.toFixed(2)} Bs`, 380, y, { width: 65, align: 'right' });
        y += 14;
      }

      y += 4;
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#dddddd').lineWidth(0.5).stroke();
      y += 8;

      // Totales
      doc.fontSize(9).fillColor(GRIS)
        .text(`Subtotal:`, 280, y, { width: 95, align: 'right' })
        .text(`${Number(tx.subtotal).toFixed(2)} Bs`, 380, y, { width: 65, align: 'right' });
      y += 13;
      if (Number(tx.descuento) > 0) {
        doc.text(`Descuento:`, 280, y, { width: 95, align: 'right' })
          .fillColor('#c0392b').text(`-${Number(tx.descuento).toFixed(2)} Bs`, 380, y, { width: 65, align: 'right' });
        y += 13;
        doc.fillColor(GRIS);
      }
      doc.font('Helvetica-Bold').fontSize(11).fillColor(AZUL)
        .text(`TOTAL:`, 280, y, { width: 95, align: 'right' })
        .text(`${Number(tx.totalCobrado).toFixed(2)} Bs`, 380, y, { width: 65, align: 'right' });

      y += 30;
      doc.fontSize(7).font('Helvetica').fillColor(GRIS)
        .text('¡Gracias por su preferencia! Este comprobante es válido como constancia de pago.', 50, y, { align: 'center' });

      doc.end();
    });
  }

  async findOne(id: string): Promise<TransaccionCaja> {
    return this.findOneWithManager(id);
  }

  async cancelar(id: string, usuarioId: string): Promise<TransaccionCaja> {
    const transaccion = await this.findOne(id);
    if (transaccion.estadoTransaccion !== 'Completada') {
      throw new BadRequestException('Solo se pueden anular transacciones completadas.');
    }
    transaccion.estadoTransaccion = 'Anulada';
    transaccion.updatedBy = usuarioId;
    const anulada = await this.transaccionRepo.save(transaccion);

    await this.logsService.registrar({
      usuarioId,
      accion: 'TRANSACCION_ANULADA',
      categoria: 'FINANZAS',
      tablaAfectada: 'transacciones_caja',
      registroId: id,
      detalles: { total: transaccion.totalCobrado, metodo: transaccion.metodoPago },
    });

    return anulada;
  }

  remove(): never {
    throw new BadRequestException('Las transacciones de caja no se eliminan; use anulacion controlada.');
  }

  private async findOneWithManager(id: string, manager = this.transaccionRepo.manager): Promise<TransaccionCaja> {
    const transaccion = await manager.getRepository(TransaccionCaja).findOne({
      where: { id },
      relations: [
        'cajero',
        'cliente',
        'historial',
        'hospitalizacion',
      ],
    });
    if (!transaccion) {
      throw new NotFoundException('La transaccion de caja no existe.');
    }
    return transaccion;
  }

  private async createClinico(createDto: CobroClinicoInput, cajeroId: string): Promise<TransaccionCaja> {
    if (!createDto.detalles?.length) {
      throw new BadRequestException('No hay conceptos clinicos pendientes para cobrar.');
    }

    return this.dataSource.transaction(async (manager) => {
      const transaccionRepo = manager.getRepository(TransaccionCaja);
      const detalleRepo = manager.getRepository(DetalleTransaccion);
      const productoRepo = manager.getRepository(Producto);
      const loteRepo = manager.getRepository(LoteCaducidad);
      const kardexRepo = manager.getRepository(KardexInventario);

      const subtotal = this.roundMoney(createDto.detalles.reduce((acc, detalle) => {
        return acc + Number(detalle.precio_unitario ?? 0) * detalle.cantidad;
      }, 0));
      const descuento = await this.validarYAplicarDescuento(subtotal, createDto.descuento ?? 0);

      const nuevaTransaccion = new TransaccionCaja();
      nuevaTransaccion.id_cajero_fk = cajeroId;
      nuevaTransaccion.id_cliente_fk = createDto.id_cliente_fk ?? null;
      nuevaTransaccion.id_historial_fk = createDto.id_historial_fk ?? null;
      nuevaTransaccion.id_hospitalizacion_fk = createDto.id_hospitalizacion_fk ?? null;
      nuevaTransaccion.subtotal = subtotal;
      nuevaTransaccion.descuento = descuento;
      nuevaTransaccion.totalCobrado = this.roundMoney(subtotal - descuento);
      nuevaTransaccion.metodoPago = createDto.metodo_pago;
      nuevaTransaccion.estadoTransaccion = 'Completada';
      nuevaTransaccion.turno = createDto.turno ?? null;
      nuevaTransaccion.createdBy = cajeroId;
      nuevaTransaccion.updatedBy = cajeroId;
      const transaccion = await transaccionRepo.save(nuevaTransaccion);

      for (const linea of createDto.detalles) {
        let loteId = linea.id_lote_fk ?? null;

        if (linea.id_producto_fk && linea.descontar_stock) {
          const producto = await productoRepo.findOne({
            where: { id: linea.id_producto_fk },
            lock: { mode: 'pessimistic_write' },
          });
          if (!producto) {
            throw new NotFoundException('Uno de los productos clinicos no existe.');
          }
          if (Number(producto.stockActual) < linea.cantidad) {
            throw new BadRequestException(`Stock insuficiente para ${producto.nombre}.`);
          }

          const lotesConsumo = await this.reservarLotes(loteRepo, producto.id, linea.cantidad, linea.id_lote_fk);
          producto.stockActual = Number(producto.stockActual) - linea.cantidad;
          producto.updatedBy = cajeroId;
          await productoRepo.save(producto);

          for (const consumo of lotesConsumo) {
            consumo.lote.cantidadActual = Number(consumo.lote.cantidadActual) - consumo.cantidad;
            consumo.lote.updatedBy = cajeroId;
            await loteRepo.save(consumo.lote);
          }
          loteId = lotesConsumo.length === 1 ? lotesConsumo[0].lote.id : loteId;

          await kardexRepo.save(kardexRepo.create({
            idProductoFk: producto.id,
            idUsuarioFk: cajeroId,
            tipoMovimiento: 'Salida_Venta',
            cantidad: linea.cantidad,
            saldoResultante: producto.stockActual,
            motivoDetalle: `Venta clinica ${transaccion.id}`,
            idLoteFk: loteId,
            idTransaccionFk: transaccion.id,
            idHistorialFk: createDto.id_historial_fk ?? null,
            createdBy: cajeroId,
          }));
        }

        const nuevoDetalle = new DetalleTransaccion();
        nuevoDetalle.id_transaccion_fk = transaccion.id;
        nuevoDetalle.id_producto_fk = linea.id_producto_fk ?? null;
        nuevoDetalle.id_servicio_fk = linea.id_servicio_fk ?? null;
        nuevoDetalle.id_receta_fk = linea.id_receta_fk ?? null;
        nuevoDetalle.id_lote_fk = loteId;
        nuevoDetalle.cantidad = linea.cantidad;
        nuevoDetalle.precioUnitario = Number(linea.precio_unitario ?? 0);
        nuevoDetalle.subtotalLinea = this.roundMoney(nuevoDetalle.precioUnitario * linea.cantidad);
        nuevoDetalle.tipo_cobro = linea.tipo_cobro ?? (linea.id_producto_fk ? 'entrega' : 'previo');
        nuevoDetalle.createdBy = cajeroId;
        nuevoDetalle.updatedBy = cajeroId;
        await detalleRepo.save(nuevoDetalle);
      }

      if (createDto.id_historial_fk) {
        const historial = await manager.getRepository(HistorialClinico).findOne({
          where: { id: createDto.id_historial_fk },
          lock: { mode: 'pessimistic_write' },
        });
        if (!historial) {
          throw new NotFoundException('El historial clinico no existe.');
        }
        if (historial.estado === 'Facturado') {
          throw new BadRequestException('Este historial ya esta facturado.');
        }
        historial.estado = 'Facturado';
        historial.updatedBy = cajeroId;
        await manager.getRepository(HistorialClinico).save(historial);
      }

      return this.findOneWithManager(transaccion.id, manager);
    });
  }

  private calcularDiasHospitalizacion(inicio: Date, fin: Date): number {
    const msPorDia = 24 * 60 * 60 * 1000;
    const diff = Math.ceil((fin.getTime() - inicio.getTime()) / msPorDia);
    return Math.max(diff, 1);
  }

  private async reservarLotes(
    loteRepo: Repository<LoteCaducidad>,
    productoId: string,
    cantidad: number,
    loteId?: string,
  ): Promise<Array<{ lote: LoteCaducidad; cantidad: number }>> {
    if (loteId) {
      const lote = await loteRepo.findOne({
        where: { id: loteId, idProductoFk: productoId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lote) {
        throw new NotFoundException('El lote seleccionado no existe para el producto.');
      }
      if (Number(lote.cantidadActual) < cantidad) {
        throw new BadRequestException('Stock insuficiente en el lote seleccionado.');
      }
      return [{ lote, cantidad }];
    }

    const lotes = await loteRepo.find({
      where: { idProductoFk: productoId },
      order: { fechaVencimiento: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });

    let pendiente = cantidad;
    const consumo: Array<{ lote: LoteCaducidad; cantidad: number }> = [];
    for (const lote of lotes) {
      if (pendiente <= 0) break;
      const disponible = Number(lote.cantidadActual);
      if (disponible <= 0) continue;
      const usar = Math.min(disponible, pendiente);
      consumo.push({ lote, cantidad: usar });
      pendiente -= usar;
    }

    if (pendiente > 0) {
      throw new BadRequestException('No hay lotes suficientes para cubrir la venta del producto.');
    }
    return consumo;
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
