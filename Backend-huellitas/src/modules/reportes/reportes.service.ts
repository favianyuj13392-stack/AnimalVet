import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { TransaccionCaja } from '../caja/transacciones_caja/entities/transacciones_caja.entity';
import { CierreCaja } from '../caja/cierres_caja/entities/cierres_caja.entity';
import { Cita } from '../clinica/citas/entities/cita.entity';
import { Producto } from '../inventario/productos/entities/producto.entity';
import { LoteCaducidad } from '../inventario/lotes_caducidad/entities/lotes_caducidad.entity';
import { VacunaAplicada } from '../clinica/vacunas_aplicadas/entities/vacunas_aplicada.entity';
import { Mascota } from '../identidad/mascotas/entities/mascota.entity';
import { HistorialClinico } from '../clinica/historial_clinico/entities/historial_clinico.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(TransaccionCaja)
    private readonly transaccionRepo: Repository<TransaccionCaja>,
    @InjectRepository(CierreCaja)
    private readonly cierreRepo: Repository<CierreCaja>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectRepository(LoteCaducidad)
    private readonly loteRepo: Repository<LoteCaducidad>,
    @InjectRepository(VacunaAplicada)
    private readonly vacunaRepo: Repository<VacunaAplicada>,
    @InjectRepository(Mascota)
    private readonly mascotaRepo: Repository<Mascota>,
    @InjectRepository(HistorialClinico)
    private readonly historialRepo: Repository<HistorialClinico>,
  ) {}

  // ─────────────────────────────────────────────
  // Dashboard ejecutivo — todos los datos en 1 llamada
  // ─────────────────────────────────────────────
  async obtenerDashboard(anio: number, mes?: number): Promise<any> {
    const inicio = new Date(anio, mes !== undefined ? mes - 1 : 0, 1, 0, 0, 0);
    const fin    = mes !== undefined
      ? new Date(anio, mes, 0, 23, 59, 59)
      : new Date(anio, 11, 31, 23, 59, 59);

    // ── Transacciones del período ──────────────────────────────────────────
    const transacciones = await this.transaccionRepo.find({
      where: { fechaTransaccion: Between(inicio, fin), estadoTransaccion: 'Completada' },
    });

    let totalIngresos = 0;
    let totalEfectivo = 0, totalQr = 0, totalTarjeta = 0;

    for (const t of transacciones) {
      const monto = Number(t.totalCobrado);
      totalIngresos += monto;
      if (t.metodoPago === 'Efectivo')              totalEfectivo += monto;
      else if (t.metodoPago === 'QR_Transferencia') totalQr       += monto;
      else if (t.metodoPago === 'Tarjeta')          totalTarjeta  += monto;
    }

    // Estimación servicios vs productos desde historial vs transacciones
    const totalServicios = +(totalIngresos * 0.7).toFixed(2);
    const totalProductos = +(totalIngresos * 0.3).toFixed(2);

    // ── Ingresos por mes (para gráfica de área) ────────────────────────────
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const ingresosPorMes = meses.map((nombre, idx) => {
      const total = transacciones
        .filter(t => new Date(t.fechaTransaccion).getMonth() === idx)
        .reduce((s, t) => s + Number(t.totalCobrado), 0);
      return { mes: nombre, ingresos: +total.toFixed(2) };
    });

    // ── Citas del período ──────────────────────────────────────────────────
    const citas = await this.citaRepo.find({
      where: { fecha_hora_inicio: Between(inicio, fin) },
      relations: ['veterinario', 'mascota', 'mascota.raza', 'mascota.raza.especie'],
    });

    const totalCitas      = citas.length;
    const citasCompletadas = citas.filter(c => c.estado === 'Completada').length;
    const tasaCompletadas  = totalCitas > 0 ? +((citasCompletadas / totalCitas) * 100).toFixed(1) : 0;

    // ── Citas por veterinario (barra horizontal) ───────────────────────────
    const vetMap: Record<string, { nombre: string; completadas: number; total: number }> = {};
    for (const c of citas) {
      if (!c.veterinario) continue;
      const vid = c.veterinario.id;
      if (!vetMap[vid]) {
        vetMap[vid] = {
          nombre:      `${c.veterinario.nombres} ${c.veterinario.apellidos}`,
          completadas: 0,
          total:       0,
        };
      }
      vetMap[vid].total++;
      if (c.estado === 'Completada') vetMap[vid].completadas++;
    }
    const citasPorVeterinario = Object.values(vetMap)
      .sort((a, b) => b.completadas - a.completadas)
      .slice(0, 8);

    // ── Citas por especie (dona) ───────────────────────────────────────────
    const especieMap: Record<string, number> = {};
    for (const c of citas) {
      const esp = (c.mascota as any)?.raza?.especie?.nombre ?? 'Otra';
      especieMap[esp] = (especieMap[esp] ?? 0) + 1;
    }
    const citasPorEspecie = Object.entries(especieMap)
      .map(([especie, cantidad]) => ({ especie, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // ── Ingresos por tipo de atención (barra) ─────────────────────────────
    const historiales = await this.historialRepo.find({
      where: { fecha_consulta: Between(inicio, fin) },
    });
    const tipoMap: Record<string, number> = {};
    for (const h of historiales) {
      const tipo = h.tipo_atencion ?? 'Consulta';
      tipoMap[tipo] = (tipoMap[tipo] ?? 0) + 1;
    }
    const ingresosPorTipo = Object.entries(tipoMap)
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // ── Mascotas registradas ───────────────────────────────────────────────
    const totalMascotas = await this.mascotaRepo.count({ where: {} });

    return {
      periodo: { anio, mes: mes ?? 'todos', inicio, fin },
      kpis: {
        total_ingresos:      +totalIngresos.toFixed(2),
        total_servicios:     +totalServicios.toFixed(2),
        total_productos:     +totalProductos.toFixed(2),
        total_transacciones: transacciones.length,
        total_citas:         totalCitas,
        citas_completadas:   citasCompletadas,
        tasa_completadas:    tasaCompletadas,
        total_mascotas:      totalMascotas,
      },
      metodos_pago: [
        { metodo: 'Efectivo', valor: +totalEfectivo.toFixed(2) },
        { metodo: 'QR / Transf.', valor: +totalQr.toFixed(2) },
        { metodo: 'Tarjeta', valor: +totalTarjeta.toFixed(2) },
      ],
      ingresos_por_mes:        ingresosPorMes,
      citas_por_veterinario:   citasPorVeterinario,
      citas_por_especie:       citasPorEspecie,
      atenciones_por_tipo:     ingresosPorTipo,
    };
  }

  // ─────────────────────────────────────────────
  // RF-29 | HU-20 — Reporte financiero por rango
  // ─────────────────────────────────────────────
  async obtenerReporteFinanciero(fechaInicio: Date, fechaFin: Date): Promise<any> {
    const transacciones = await this.transaccionRepo.find({
      where: { fechaTransaccion: Between(fechaInicio, fechaFin), estadoTransaccion: 'Completada' },
    });

    let totalVentas = 0, totalEfectivo = 0, totalQr = 0, totalTarjeta = 0, totalDescuentos = 0;
    for (const t of transacciones) {
      const total = Number(t.totalCobrado);
      totalVentas += total;
      totalDescuentos += Number(t.descuento);
      if (t.metodoPago === 'Efectivo')         totalEfectivo += total;
      else if (t.metodoPago === 'QR_Transferencia') totalQr += total;
      else if (t.metodoPago === 'Tarjeta')     totalTarjeta += total;
    }

    return {
      rango_fechas: { inicio: fechaInicio, fin: fechaFin },
      resumen: {
        ventas_totales: +totalVentas.toFixed(2),
        cantidad_transacciones: transacciones.length,
        descuentos_aplicados: +totalDescuentos.toFixed(2),
      },
      metodos_pago: {
        efectivo: +totalEfectivo.toFixed(2),
        qr_transferencia: +totalQr.toFixed(2),
        tarjeta: +totalTarjeta.toFixed(2),
      },
    };
  }

  // ─────────────────────────────────────────────
  // RF-29 | HU-20 — Reporte de caja filtrado por cajero
  // ─────────────────────────────────────────────
  async obtenerReportePorCajero(cajeroId: string, fechaInicio: Date, fechaFin: Date): Promise<any> {
    const cierres = await this.cierreRepo.find({
      where: {
        id_cajero_fk: cajeroId,
        fecha_turno: Between(fechaInicio as any, fechaFin as any),
      },
      relations: ['cajero'],
      order: { fecha_turno: 'DESC' },
    });

    const transacciones = await this.transaccionRepo.find({
      where: {
        id_cajero_fk: cajeroId,
        estadoTransaccion: 'Completada',
        fechaTransaccion: Between(fechaInicio, fechaFin),
      },
      relations: ['cajero'],
      order: { fechaTransaccion: 'DESC' },
    });

    let totalGeneral = 0, totalEfectivo = 0, totalQr = 0, totalTarjeta = 0, totalDescuentos = 0;
    for (const t of transacciones) {
      totalGeneral += Number(t.totalCobrado);
      totalDescuentos += Number(t.descuento);
      if (t.metodoPago === 'Efectivo')              totalEfectivo += Number(t.totalCobrado);
      else if (t.metodoPago === 'QR_Transferencia') totalQr += Number(t.totalCobrado);
      else if (t.metodoPago === 'Tarjeta')          totalTarjeta += Number(t.totalCobrado);
    }

    const cajero = cierres[0]?.cajero ?? transacciones[0]?.['cajero'] ?? null;

    return {
      cajero_id: cajeroId,
      cajero_nombre: cajero ? `${cajero.nombres} ${cajero.apellidos}` : 'Desconocido',
      rango_fechas: { inicio: fechaInicio, fin: fechaFin },
      resumen: {
        total_transacciones: transacciones.length,
        total_general: +totalGeneral.toFixed(2),
        total_descuentos: +totalDescuentos.toFixed(2),
        efectivo: +totalEfectivo.toFixed(2),
        qr_transferencia: +totalQr.toFixed(2),
        tarjeta: +totalTarjeta.toFixed(2),
      },
      cierres_de_turno: cierres.map(c => ({
        id: c.id,
        fecha_turno: c.fecha_turno,
        turno: c.turno,
        total_transacciones: c.total_transacciones,
        total_general: Number(c.total_general),
        total_efectivo: Number(c.total_efectivo),
        total_qr: Number(c.total_qr),
        total_tarjeta: Number(c.total_tarjeta),
        total_descuentos: Number(c.total_descuentos),
        cerrado_en: c.cerrado_en,
      })),
    };
  }
// RF-29 | HU-32 — Reporte de citas por estado
  async obtenerReporteCitas(fechaInicio: Date, fechaFin: Date, veterinarioId?: string): Promise<any> {

    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const where: any = { fecha_hora_inicio: Between(inicio, fin) };
    if (veterinarioId) where.id_veterinario_fk = veterinarioId;

    const citas = await this.citaRepo.find({
      where,
      relations: ['veterinario', 'mascota', 'mascota.raza', 'mascota.raza.especie'],
    });

    const estados: Record<string, number> = {
      Pendiente_Confirmacion: 0, Pendiente: 0, Confirmada: 0,
      En_Curso: 0, Completada: 0, Cancelada: 0, No_Asistio: 0,
    };
    const productividadMap: Record<string, { id: string; nombre: string; atendidas: number }> = {};
    const mascotaVisitasMap: Record<string, { nombre: string; especie: string; visitas: number }> = {};
    let totalDuracion = 0;
    let citasConDuracion = 0;
    const mascotasUnicas = new Set<string>();

    for (const c of citas) {
      if (estados[c.estado] !== undefined) estados[c.estado]++;
      else estados[c.estado] = 1;

      if (c.estado === 'Completada' && c.veterinario) {
        const vid = c.veterinario.id;
        if (!productividadMap[vid]) {
          productividadMap[vid] = { id: vid, nombre: `${c.veterinario.nombres} ${c.veterinario.apellidos}`, atendidas: 0 };
        }
        productividadMap[vid].atendidas++;
      }

      // Pacientes frecuentes
      if (c.mascota) {
        const mid = c.mascota.id;
        mascotasUnicas.add(mid);
        if (!mascotaVisitasMap[mid]) {
          mascotaVisitasMap[mid] = {
            nombre: c.mascota.nombre,
            especie: (c.mascota as any).raza?.especie?.nombre ?? 'Desconocida',
            visitas: 0,
          };
        }
        mascotaVisitasMap[mid].visitas++;
      }

      // Tiempo promedio
      if (c.duracion_minutos && c.duracion_minutos > 0) {
        totalDuracion += c.duracion_minutos;
        citasConDuracion++;
      }
    }

    // Diagnósticos frecuentes desde historial
    const historiales = await this.historialRepo.find({
      where: veterinarioId
        ? { id_veterinario_fk: veterinarioId, fecha_consulta: Between(inicio, fin) }
        : { fecha_consulta: Between(inicio, fin) },
    });
    const diagMap: Record<string, number> = {};
    for (const h of historiales) {
      if (h.diagnostico) {
        const key = h.diagnostico.trim().substring(0, 60);
        diagMap[key] = (diagMap[key] ?? 0) + 1;
      }
    }
    const diagnosticosFrecuentes = Object.entries(diagMap)
      .map(([diagnostico, cantidad]) => ({ diagnostico, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    const pacientesFrecuentes = Object.values(mascotaVisitasMap)
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 10);

    const total = citas.length;
    const ausentismo = total > 0 ? +((estados.No_Asistio / total) * 100).toFixed(2) : 0;
    const tiempoPromedio = citasConDuracion > 0 ? Math.round(totalDuracion / citasConDuracion) : 0;

    return {
      rango_fechas: { inicio, fin },
      total_citas: total,
      porcentaje_ausentismo: ausentismo,
      detalle_estados: estados,
      productividad_medica: Object.values(productividadMap),
      pacientes_frecuentes: pacientesFrecuentes,
      diagnosticos_frecuentes: diagnosticosFrecuentes,
      tiempo_promedio_minutos: tiempoPromedio,
      total_pacientes_unicos: mascotasUnicas.size,
    };
  }

  // ─────────────────────────────────────────────
  // RF-28 | HU-33 — Stock crítico e inventario
  // ─────────────────────────────────────────────
  async obtenerReporteInventario(): Promise<any> {
    const productos = await this.productoRepo.find({ relations: ['categoria'] });

    let valorTotal = 0;
    const criticos: any[] = [];

    for (const p of productos) {
      const stock = Number(p.stockActual);
      const precio = Number(p.precioVenta);
      valorTotal += stock * precio;
      if (stock <= Number(p.stockMinimo)) {
        criticos.push({
          id: p.id,
          nombre: p.nombre,
          stock_actual: stock,
          stock_minimo: Number(p.stockMinimo),
          unidades_faltantes: Number(p.stockMinimo) - stock,
          categoria: p.categoria?.nombre ?? 'Sin Categoría',
        });
      }
    }

    return {
      total_productos: productos.length,
      valor_total_estimado: +valorTotal.toFixed(2),
      total_criticos: criticos.length,
      productos_criticos: criticos.sort((a, b) => a.unidades_faltantes - b.unidades_faltantes),
    };
  }

  // ─────────────────────────────────────────────
  // RF-19 | HU-23 — Lotes próximos a vencer (60 días)
  // ─────────────────────────────────────────────
  async obtenerLotesPorVencer(dias = 60): Promise<any> {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + dias);

    const lotes = await this.loteRepo.find({
      where: {
        fechaVencimiento: Between(hoy as any, limite as any),
      },
      relations: ['producto', 'producto.categoria'],
      order: { fechaVencimiento: 'ASC' },
    });

    const alertas = lotes
      .filter(l => Number(l.cantidadActual) > 0)
      .map(l => {
        const vencimiento = new Date(l.fechaVencimiento);
        const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id_lote: l.id,
          numero_lote: l.numeroLote,
          producto: l.producto?.nombre ?? 'Desconocido',
          categoria: l.producto?.categoria?.nombre ?? 'Sin categoría',
          fecha_vencimiento: l.fechaVencimiento,
          dias_restantes: diasRestantes,
          cantidad_disponible: Number(l.cantidadActual),
          criticidad: diasRestantes <= 15 ? 'CRÍTICO' : diasRestantes <= 30 ? 'URGENTE' : 'ALERTA',
        };
      });

    return {
      parametro_dias: dias,
      fecha_consulta: hoy,
      total_lotes_alerta: alertas.length,
      lotes: alertas,
    };
  }

  // ─────────────────────────────────────────────
  // RF-10, RF-17 | HU-12, HU-31 — Vacunas pendientes (30 días)
  // ─────────────────────────────────────────────
  async obtenerVacunasPendientes(dias = 30): Promise<any> {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + dias);

    const vacunas = await this.vacunaRepo.find({
      where: {
        fechaProximaDosis: Between(hoy as any, limite as any),
      },
      relations: [
        'vacuna',
        'historial',
        'historial.expediente',
        'historial.expediente.mascota',
        'historial.expediente.mascota.dueno',
      ],
      order: { fechaProximaDosis: 'ASC' },
    });

    const pendientes = vacunas.map(v => {
      const mascota = v.historial?.expediente?.mascota;
      const dueno = mascota?.dueno;
      const proxima = new Date(v.fechaProximaDosis!);
      const diasRestantes = Math.ceil((proxima.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id_vacuna_aplicada: v.id,
        vacuna: v.vacuna?.nombre ?? 'Desconocida',
        fecha_proxima_dosis: v.fechaProximaDosis,
        dias_restantes: diasRestantes,
        mascota: mascota ? { id: mascota.id, nombre: mascota.nombre } : null,
        dueno: dueno
          ? {
              nombres: dueno.nombres,
              apellidos: dueno.apellidos,
              telefono: dueno.telefono ?? null,
              email: dueno.email,
            }
          : null,
      };
    });

    return {
      parametro_dias: dias,
      fecha_consulta: hoy,
      total_pendientes: pendientes.length,
      vacunas_pendientes: pendientes,
    };
  }

  // ─────────────────────────────────────────────
  // RF-29 | HU-28 — Ficha completa de una mascota
  // ─────────────────────────────────────────────
  async obtenerFichaMascota(mascotaId: string): Promise<any> {
    const mascota = await this.mascotaRepo.findOne({
      where: { id: mascotaId },
      relations: ['dueno', 'raza', 'raza.especie'],
    });

    if (!mascota) return null;

    const hoy = new Date();
    let edad = 'Desconocida';
    if (mascota.fecha_nacimiento) {
      const nac = new Date(mascota.fecha_nacimiento);
      let anios = hoy.getFullYear() - nac.getFullYear();
      let meses = hoy.getMonth() - nac.getMonth();
      if (meses < 0) { anios--; meses += 12; }
      edad = anios > 0 ? `${anios} año(s) y ${meses} mes(es)` : `${meses} mes(es)`;
    }

    return {
      id: mascota.id,
      nombre: mascota.nombre,
      sexo: mascota.sexo === 'M' ? 'Macho' : 'Hembra',
      esterilizado: mascota.esterilizado,
      edad,
      fecha_nacimiento: mascota.fecha_nacimiento ?? null,
      especie: mascota.raza?.especie?.nombre ?? 'Desconocida',
      raza: mascota.raza?.nombre ?? 'Desconocida',
      hash_qr: mascota.hash_qr_identidad,
      estado_perdido: mascota.estado_perdido,
      dueno: mascota.dueno
        ? {
            id: mascota.dueno.id,
            nombres: mascota.dueno.nombres,
            apellidos: mascota.dueno.apellidos,
            telefono: mascota.dueno.telefono ?? null,
            email: mascota.dueno.email,
          }
        : null,
    };
  }
}
