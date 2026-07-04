import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { LogsSistemaService } from '../../core/logs_sistema/logs_sistema.service';

import { HistorialClinico } from './entities/historial_clinico.entity';
import { Cita } from '../citas/entities/cita.entity';
import { ExpedienteClinico } from '../expediente_clinico/entities/expediente_clinico.entity';
import { Mascota } from '../../identidad/mascotas/entities/mascota.entity';
import { MonitoreoDiario } from '../monitoreo_diario/entities/monitoreo_diario.entity';
import { ExpedienteClinicoService } from '../expediente_clinico/expediente_clinico.service';

import { CreateHistorialClinicoDto } from './dto/create-historial_clinico.dto';
import { UpdateHistorialClinicoDto } from './dto/update-historial_clinico.dto';
import { HistorialClinicoResponseDto } from './dto/historial-clinico-response.dto';

// 👇 AGREGA ESTAS IMPORTACIONES NUEVAS 👇
import { Receta } from '../recetas/entities/receta.entity';
import { DetallesReceta} from '../detalles_receta/entities/detalles_receta.entity'; // Asegúrate del nombre exacto de tu entidad
import { VacunaAplicada } from '../vacunas_aplicadas/entities/vacunas_aplicada.entity';
import { Hospitalizacion } from '../hospitalizaciones/entities/hospitalizacione.entity';
import { FinalizarConsultaDto } from './dto/finalizar-consulta.dto';
import { ArchivoAdjunto } from '../archivos_adjuntos/entities/archivos_adjunto.entity';
import { CatalogoVacuna } from '../../core/catalogo_vacunas/entities/catalogo_vacuna.entity';
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { LoteCaducidad } from '../../inventario/lotes_caducidad/entities/lotes_caducidad.entity';
import { KardexInventario } from '../../inventario/kardex_inventario/entities/kardex_inventario.entity';
import { EnvaseAbierto } from '../../inventario/productos/entities/envase_abierto.entity';
import { CitasGateway } from '../citas/citas.gateway';
import { MensajeroService } from '../../comunicacion/mensajero/mensajero.service';
@Injectable()
export class HistorialClinicoService {
  constructor(
    @InjectRepository(HistorialClinico)
    private readonly historialRepository: Repository<HistorialClinico>,

    @InjectRepository(Cita)
    private readonly citasRepository: Repository<Cita>,
    @InjectRepository(ExpedienteClinico)
    private readonly expedienteRepository: Repository<ExpedienteClinico>,
    @InjectRepository(Mascota)
    private readonly mascotaRepository: Repository<Mascota>,
    @InjectRepository(MonitoreoDiario)
    private readonly monitoreoRepository: Repository<MonitoreoDiario>,

    private readonly expedienteService: ExpedienteClinicoService,
    private readonly logsService: LogsSistemaService,
    private readonly dataSource: DataSource,
    private readonly citasGateway: CitasGateway,
    private readonly mensajeroService: MensajeroService,
  ) {}

  private readonly logger = new Logger(HistorialClinicoService.name);

  async create(createDto: CreateHistorialClinicoDto, usuarioId: string): Promise<HistorialClinicoResponseDto> {
    // 1. OBTENEMOS LA CITA Y LA MASCOTA
    const cita = await this.citasRepository.findOne({ 
      where: { id: createDto.id_cita_fk },
      relations: ['mascota', 'veterinario'] 
    });
    
    if (!cita) throw new NotFoundException('La cita vinculada no existe.');
    
    // Regla de negocio: No se puede escribir historial si la cita no ha empezado
    if (cita.estado !== 'En_Curso') {
      throw new ConflictException(`La mascota debe estar [En_Curso] para generar el historial.`);
    }

    // 2. OBTENEMOS EL EXPEDIENTE (Gracias a la automatización que hicimos)
    const expediente = await this.expedienteService.findByMascota(cita.mascota.id);

    // 3. CREACIÓN Y ASIGNACIÓN DE CAMPOS OBLIGATORIOS (Entidad)
    const nuevoHistorial = this.historialRepository.create({
      ...createDto,
      id_expediente_fk: expediente.id,       // Conectamos al "folder" de la mascota
      id_veterinario_fk: cita.id_veterinario_fk, // El veterinario de la cita firma
      id_cita_fk: cita.id,
      estado: 'Abierto', // Se guarda cerrado directamente para inalterabilidad
      
      // Mapeo de campos numéricos obligatorios de tu Entity
      peso_kg: createDto.peso_actual_kg || 0,
      temperatura_c: createDto.temperatura_c ?? 38.5,        // Valores del DTO o base
      frecuencia_cardiaca: createDto.frecuencia_cardiaca ?? 80,
      frecuencia_respiratoria: createDto.frecuencia_respiratoria ?? 20,
      triaje_completado: createDto.triaje_completado ?? true,
      tipo_atencion: createDto.tipo_atencion ?? 'Consulta',
      
      // Auditoría (Modo Dios)
      createdBy: usuarioId,
      updatedBy: usuarioId,
      
      // Relaciones para el guardado
      cita: cita,
      veterinario: cita.veterinario
    });

    const historialGuardado = await this.historialRepository.save(nuevoHistorial);

 

    // 4. EL MAPEO AL RESPONSE DTO (Salida limpia para el Frontend)
    return {
      id: historialGuardado.id,
      fecha_consulta: historialGuardado.fecha_consulta,
      motivo_consulta: historialGuardado.motivo_consulta,
      sintomas: historialGuardado.sintomas ?? undefined,
      diagnostico: historialGuardado.diagnostico,
      notas_internas: historialGuardado.notas_internas ?? undefined,
      peso_actual_kg: Number(historialGuardado.peso_kg),
      temperatura_c: Number(historialGuardado.temperatura_c),
      frecuencia_cardiaca: Number(historialGuardado.frecuencia_cardiaca),
      frecuencia_respiratoria: Number(historialGuardado.frecuencia_respiratoria),
      tipo_atencion: historialGuardado.tipo_atencion,
      triaje_completado: historialGuardado.triaje_completado,
      estado: historialGuardado.estado,
      veterinario: historialGuardado.veterinario ? {
        id: historialGuardado.veterinario.id,
        nombres: historialGuardado.veterinario.nombres,
        apellidos: historialGuardado.veterinario.apellidos,
        email: historialGuardado.veterinario.email,
      } : undefined,
      mascota: cita.mascota ? {
        id: cita.mascota.id,
        nombre: cita.mascota.nombre,
        sexo: cita.mascota.sexo
      } : undefined,
      cita: historialGuardado.cita ? {
        id: historialGuardado.cita.id,
        estado: historialGuardado.cita.estado,
      } : undefined
    };
  }



// =========================================================================
  // SÚPER ENDPOINT: TRANSACCIÓN TODO O NADA
  // =========================================================================
  async finalizarConsultaTransaccional(dto: FinalizarConsultaDto, usuarioId: string) {
    // 1. Verificaciones iniciales (fuera de la transacción)
    const cita = await this.citasRepository.findOne({ 
      where: { id: dto.historial.id_cita_fk },
      relations: ['mascota', 'mascota.dueno', 'mascota.raza', 'mascota.raza.especie', 'veterinario'] 
    });
    
    if (!cita) throw new NotFoundException('La cita vinculada no existe.');
    if (cita.estado !== 'En_Curso') {
      throw new ConflictException(`La mascota debe estar [En_Curso] para finalizar la consulta.`);
    }

    const expediente = await this.expedienteService.findByMascota(cita.mascota.id);

    // 2. INICIA LA TRANSACCIÓN
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // --- A. GUARDAR HISTORIAL ---
      const nuevoHistorial = queryRunner.manager.create(HistorialClinico, {
        ...dto.historial,
        id_expediente_fk: expediente.id,
        id_veterinario_fk: cita.id_veterinario_fk,
        id_cita_fk: cita.id,
        estado: 'Abierto', // Nace abierto para permitir vincular las demás entidades
        peso_kg: dto.historial.peso_actual_kg,
        temperatura_c: dto.historial.temperatura_c ?? 38.5,
        frecuencia_cardiaca: dto.historial.frecuencia_cardiaca ?? 80,
        frecuencia_respiratoria: dto.historial.frecuencia_respiratoria ?? 20,
        triaje_completado: dto.historial.triaje_completado ?? true,
        tipo_atencion: dto.historial.tipo_atencion ?? 'Consulta',
        createdBy: usuarioId,
        updatedBy: usuarioId,
      });
      const hcGuardado = await queryRunner.manager.save(HistorialClinico, nuevoHistorial);

      // --- B. GUARDAR RECETA (Y SUS DETALLES) ---
     // --- B. GUARDAR RECETA (Y SUS DETALLES) ---
   // --- B. GUARDAR RECETA ---
      const nuevaReceta = queryRunner.manager.create(Receta, {
        idHistorialFk: hcGuardado.id,
        idVeterinarioFk: cita.id_veterinario_fk,
        indicacionesGrales: dto.historial.notas_internas || 'Tomar según dosis indicadas',
        createdBy: usuarioId,
        updatedBy: usuarioId,
      });
      const recetaGuardada = await queryRunner.manager.save(Receta, nuevaReceta);
      const recetaDetallesGuardados: DetallesReceta[] = [];

      for (const item of dto.receta) {
        const idProducto = typeof item.id_producto === 'string' && item.id_producto.trim() !== ''
          ? item.id_producto.trim()
          : null;
        const medicamentoTexto = typeof item.medicamento_texto === 'string' && item.medicamento_texto.trim() !== ''
          ? item.medicamento_texto.trim()
          : null;
        if (!!idProducto === !!medicamentoTexto) {
          throw new BadRequestException('Cada detalle de receta debe tener un producto o un medicamento en texto, pero no ambos.');
        }
        
        let isUUID = false;
        let prodObj: Producto | null = null;
        if (idProducto) {
          const producto = await queryRunner.manager.getRepository(Producto).findOne({ where: { id: idProducto } });
          if (!producto) {
            throw new NotFoundException('Producto de receta no encontrado.');
          }
          isUUID = true;
          prodObj = producto;

          // Descontar inventario de forma proactiva en la consulta clínica (Auto-FIFO si es multidosis)
          if (producto.tipoProducto === 'Multidosis') {
            // Parsear la dosis (ej: "2.5 ml" -> 2.5, "3 gotas" -> 3)
            const matchDosis = item.dosis.match(/([0-9]+(?:\.[0-9]+)?)/);
            const cantidadDosis = matchDosis ? parseFloat(matchDosis[1]) : 1;
            await this.descontarProductoMultidosis(
              queryRunner.manager,
              producto.id,
              cantidadDosis,
              usuarioId,
              `Aplicacion en consulta de ${producto.nombre}`,
              hcGuardado.id
            );
          } else {
            // Unitario
            await this.descontarProductoClinico(
              queryRunner.manager,
              producto.id,
              1,
              usuarioId,
              `Uso de insumo en consulta: ${producto.nombre}`,
              hcGuardado.id
            );
          }
        }
        item.id_producto = idProducto;
        item.medicamento_texto = medicamentoTexto;
        
        const detalle = queryRunner.manager.create(DetallesReceta, {
          // Usamos exactamente los nombres en camelCase de tu entidad
          idRecetaFk: recetaGuardada.id, 
          idProductoFk: isUUID ? item.id_producto : null, // Aquí sí acepta null
          medicamentoTexto: item.medicamento_texto,
          dosis: item.dosis,
          frecuencia: item.frecuencia,
          // Cambiamos a undefined para que TypeScript esté feliz
          duracionDias: item.duracion_dias ? Number(item.duracion_dias) : undefined, 
          createdBy: usuarioId,
        });
        const detalleGuardado = await queryRunner.manager.save(DetallesReceta, detalle);
        if (prodObj) {
          detalleGuardado.producto = prodObj;
        }
        recetaDetallesGuardados.push(detalleGuardado);
      }
     // --- C. GUARDAR VACUNA (Opcional) ---
      if (dto.vacuna) {
        const catalogoVacuna = await queryRunner.manager.getRepository(CatalogoVacuna).findOne({
          where: { id: Number(dto.vacuna.id_vacuna_fk) },
          relations: ['producto'],
        });
        if (!catalogoVacuna) {
          throw new NotFoundException('Vacuna no encontrada en el catalogo.');
        }
        if (catalogoVacuna.producto) {
          await this.descontarProductoClinico(
            queryRunner.manager,
            catalogoVacuna.producto.id,
            1,
            usuarioId,
            `Aplicacion de vacuna ${catalogoVacuna.nombre}`,
            hcGuardado.id,
          );
        }

        const fechaAplicacion = dto.vacuna.fecha_aplicacion
          ? new Date(dto.vacuna.fecha_aplicacion)
          : new Date();

        // Calcular automáticamente la fecha del próximo refuerzo (RF-10, HU-11)
        const fechaProximaDosis = new Date(fechaAplicacion);
        fechaProximaDosis.setDate(fechaProximaDosis.getDate() + catalogoVacuna.diasParaRefuerzo);

        const nuevaVacuna = queryRunner.manager.create(VacunaAplicada, {
          id_vacuna_fk: Number(dto.vacuna.id_vacuna_fk),
          id_historial_fk: hcGuardado.id,
          id_veterinario_fk: cita.id_veterinario_fk,
          fechaAplicacion: fechaAplicacion,
          fechaProximaDosis: fechaProximaDosis,
          loteVacuna: dto.vacuna.lote_vacuna,
          pesoMascotaKg: hcGuardado.peso_kg,
          createdBy: usuarioId,
        });
        await queryRunner.manager.save(VacunaAplicada, nuevaVacuna);
      }
      // --- E. GUARDAR ARCHIVOS ADJUNTOS (Opcional) ---
      this.logger.debug(`Archivos recibidos para historial: ${dto.archivos?.length ?? 0}`);
      if (dto.archivos && dto.archivos.length > 0) {
        for (const file of dto.archivos) {
          this.logger.debug(`Procesando archivo adjunto tipo: ${file.tipo_archivo}`);
          const nuevoArchivo = queryRunner.manager.create(ArchivoAdjunto, {
            id_historial_fk: hcGuardado.id,
            urlArchivo:      file.url_archivo,
            nombreArchivo:   file.nombre_archivo,
            tipoArchivo:     file.tipo_archivo,
            tipoEstudio:     file.tipo_estudio || 'Otro',
            origen:          'Interno',
            estadoArchivo:   'Recibido',
            fechaEstudio:    new Date(),
            observaciones:   'Archivo adjunto registrado durante la consulta.',
            createdBy:       usuarioId,
          });
          await queryRunner.manager.save(ArchivoAdjunto, nuevoArchivo);
        }
      }

    // --- D. GUARDAR HOSPITALIZACIÓN (Opcional) ---
      if (dto.hospitalizacion) {
        const nuevaHosp = queryRunner.manager.create(Hospitalizacion, {
          // 1. Las variables que declaraste con guiones bajos (snake_case) en tu entidad:
          id_historial_fk: hcGuardado.id,
          id_mascota_fk: cita.mascota.id,
          id_veterinario_responsable: cita.id_veterinario_fk,

          // 2. Las variables que declaraste en camelCase (Mapeamos desde el DTO del front):
          fechaIngreso: dto.hospitalizacion.fecha_ingreso ? new Date(dto.hospitalizacion.fecha_ingreso) : new Date(),
          motivoIngreso: dto.hospitalizacion.motivo_ingreso || hcGuardado.diagnostico,
          estadoActual: dto.hospitalizacion.estado_actual || 'Observacion',
          costoPorDia: dto.hospitalizacion.costo_por_dia ? Number(dto.hospitalizacion.costo_por_dia) : 0.00,

          createdBy: usuarioId,
        });
        await queryRunner.manager.save(Hospitalizacion, nuevaHosp);
      }

      // --- E. CERRAR EL CANDADO ---
      // 1. Cerramos el historial
      hcGuardado.estado = 'Cerrado';
      await queryRunner.manager.save(HistorialClinico, hcGuardado);

      // 2. Completamos la cita
      cita.estado = 'Completada';
      cita.updatedBy = usuarioId;
      await queryRunner.manager.save(Cita, cita);

      // --- F. CONFIRMACIÓN FINAL ---
      await queryRunner.commitTransaction();

       await this.logsService.registrar({
        usuarioId,
        accion: 'CREACION_HISTORIAL_CLINICO',
        categoria: 'CLINICO',
        tablaAfectada: 'historial_clinico',
        registroId: hcGuardado.id,
        detalles: {
          id_cita: cita.id,
          id_mascota: cita.mascota?.id,
          tipo_atencion: hcGuardado.tipo_atencion,
          tiene_vacuna: !!dto.vacuna,
          tiene_hospitalizacion: !!dto.hospitalizacion,
          tiene_archivos: (dto.archivos?.length ?? 0) > 0,
        },
      });

      // 1. Emitir WebSockets para actualizar el Punto de Venta (POS) en tiempo real
      try {
        if (this.citasGateway) {
          this.citasGateway.emitirCitaActualizada({
            id: cita.id,
            estado: 'Completada',
            id_historial: hcGuardado.id,
            mascota: cita.mascota?.nombre,
            dueno: cita.mascota?.dueno ? `${cita.mascota.dueno.nombres} ${cita.mascota.dueno.apellidos}` : 'Sin Propietario'
          });
        }
      } catch (wsError) {
        this.logger.error('Error al emitir WebSocket citaActualizada:', wsError);
      }

      // 2. Generar y enviar Receta Médica por correo electrónico al cliente (en segundo plano, sin await)
      const emailCliente = cita.mascota?.dueno?.email;
      if (emailCliente) {
        this.generarPdfRecetaBuffer(
          cita,
          hcGuardado,
          recetaGuardada,
          recetaDetallesGuardados,
          cita.mascota.dueno,
          cita.veterinario
        ).then(buffer => {
          const nombreMascota = cita.mascota?.nombre || 'su mascota';
          const nombreVet = cita.veterinario ? `${cita.veterinario.nombres} ${cita.veterinario.apellidos}` : 'Médico Veterinario';
          const cuerpoMail = `Estimado/a ${cita.mascota.dueno.nombres} ${cita.mascota.dueno.apellidos},\n\nLe enviamos adjunto el documento de la receta médica digital de **${nombreMascota}** emitida el día de hoy por el ${nombreVet} en **Animal Vet**.\n\nDetalles principales de la receta:\n- Diagnóstico: ${hcGuardado.diagnostico || 'Consulta médica'}\n- Indicaciones generales: ${recetaGuardada.indicacionesGrales || 'Tomar según dosis indicadas'}\n\nAnte cualquier duda o consulta, quedamos a su entera disposición.\n\nAtentamente,\nEl equipo de Animal Vet.`;

          return this.mensajeroService.enviarEmailDirecto(
            emailCliente,
            `Receta Médica Digital de ${nombreMascota} - Animal Vet`,
            cuerpoMail,
            [
              {
                filename: `Receta_${nombreMascota}_${new Date().toISOString().split('T')[0]}.pdf`,
                content: buffer,
              }
            ]
          );
        }).catch(emailErr => {
          this.logger.error(`Error al enviar receta por correo: ${emailErr.message}`, emailErr.stack);
        });
      }

      // 3. Mandar la pre-factura a la esposa (cajero@huellitas.com) (en segundo plano, sin await)
      this.enviarPreFacturaCajeroAsync(cita, recetaDetallesGuardados, dto.vacuna).catch(cajeroMailErr => {
        this.logger.error(`Error al enviar pre-factura al cajero: ${cajeroMailErr.message}`, cajeroMailErr.stack);
      });

      return {
        message: 'Consulta finalizada exitosamente',
        id_historial: hcGuardado.id
      };

    } catch (err: any) {
      // SI ALGO FALLA (ej. error de tipado o base de datos), REVERTIMOS TODO
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error en transacción finalizar consulta: ${err?.message}`, err?.stack);
      throw new BadRequestException(`No se pudo guardar la consulta. Verifica los datos enviados. Detalle: ${err.message}`);
    } finally {
      // Siempre se debe liberar el Runner
      await queryRunner.release();
    }
  }

  private async enviarPreFacturaCajeroAsync(cita: Cita, recetaDetallesGuardados: DetallesReceta[], vacunaDto?: any) {
    const lineasFactura: string[] = [];
    let totalEst = 0;

    if (cita.servicio) {
      const precio = Number(cita.servicio.precio);
      lineasFactura.push(`- ${cita.servicio.nombre}: $${precio.toFixed(2)}`);
      totalEst += precio;
    }

    for (const det of recetaDetallesGuardados) {
      if (det.producto) {
        const precio = Number(det.producto.precioVenta);
        lineasFactura.push(`- ${det.producto.nombre} (${det.dosis}): $${precio.toFixed(2)}`);
        totalEst += precio;
      } else if (det.medicamentoTexto) {
        lineasFactura.push(`- ${det.medicamentoTexto} (${det.dosis}): (Receta Externa - Sin Costo)`);
      }
    }

    if (vacunaDto) {
      const catalogoVacuna = await this.dataSource.getRepository(CatalogoVacuna).findOne({
        where: { id: Number(vacunaDto.id_vacuna_fk) },
        relations: ['producto'],
      });
      if (catalogoVacuna) {
        if (catalogoVacuna.producto) {
          const precio = Number(catalogoVacuna.producto.precioVenta);
          lineasFactura.push(`- Vacuna: ${catalogoVacuna.nombre} (${catalogoVacuna.producto.nombre}): $${precio.toFixed(2)}`);
          totalEst += precio;
        } else {
          lineasFactura.push(`- Vacuna: ${catalogoVacuna.nombre}: (Sin costo de producto asociado)`);
        }
      }
    }

    const nombreMascota = cita.mascota?.nombre || 'Paciente';
    const duenoNombre = cita.mascota?.dueno 
      ? `${cita.mascota.dueno.nombres} ${cita.mascota.dueno.apellidos}`
      : 'Sin Propietario';

    const cuerpoCajero = `Hola,\n\nSe ha finalizado la consulta médica de **${nombreMascota}** (Propietario: ${duenoNombre}) y está lista para facturar.\n\n**Detalles del Cobro (Pre-Factura):**\n${lineasFactura.join('\n')}\n\n**Total Estimado a Cobrar: $${totalEst.toFixed(2)}**\n\nPor favor, ingresa al módulo de Caja POS para procesar la transacción vinculada al historial clínico.\n\nAtentamente,\nSistema de Control Huellitas.`;

    await this.mensajeroService.enviarEmailDirecto(
      'cajero@huellitas.com',
      `Pre-Factura Lista: Consulta de ${nombreMascota} (${duenoNombre})`,
      cuerpoCajero
    );
    this.logger.debug('Pre-factura enviada al cajero con éxito.');
  }

  private async descontarProductoClinico(
    manager: EntityManager,
    productoId: string,
    cantidad: number,
    usuarioId: string,
    motivo: string,
    idHistorial: string | null,
  ) {
    const productoRepo = manager.getRepository(Producto);
    const loteRepo = manager.getRepository(LoteCaducidad);
    const kardexRepo = manager.getRepository(KardexInventario);

    const producto = await productoRepo.findOne({
      where: { id: productoId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!producto) throw new NotFoundException('Producto de inventario no encontrado.');
    if (Number(producto.stockActual) < cantidad) {
      throw new ConflictException(`Stock insuficiente de [${producto.nombre}]. Disponible: ${producto.stockActual}`);
    }

    const lotes = await loteRepo.find({
      where: { idProductoFk: producto.id },
      order: { fechaVencimiento: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });
    let pendiente = cantidad;
    let loteKardex: string | null = null;
    for (const lote of lotes) {
      if (pendiente <= 0) break;
      const disponible = Number(lote.cantidadActual);
      if (disponible <= 0) continue;
      const usar = Math.min(disponible, pendiente);
      lote.cantidadActual = disponible - usar;
      lote.updatedBy = usuarioId;
      await loteRepo.save(lote);
      loteKardex = loteKardex ?? lote.id;
      pendiente -= usar;
    }

    producto.stockActual = Number(producto.stockActual) - cantidad;
    producto.updatedBy = usuarioId;
    await productoRepo.save(producto);

    await kardexRepo.save(kardexRepo.create({
      idProductoFk: producto.id,
      idUsuarioFk: usuarioId,
      tipoMovimiento: 'Salida_Clinica',
      cantidad,
      saldoResultante: producto.stockActual,
      motivoDetalle: motivo,
      idLoteFk: loteKardex,
      idHistorialFk: idHistorial,
      createdBy: usuarioId,
    }));
  }

  private async descontarProductoMultidosis(
    manager: EntityManager,
    productoId: string,
    cantidadDosis: number,
    usuarioId: string,
    motivo: string,
    idHistorial: string | null,
  ) {
    const productoRepo = manager.getRepository(Producto);
    const loteRepo = manager.getRepository(LoteCaducidad);
    const envaseRepo = manager.getRepository(EnvaseAbierto);
    const kardexRepo = manager.getRepository(KardexInventario);

    const producto = await productoRepo.findOne({
      where: { id: productoId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!producto) throw new NotFoundException('Producto multidosis no encontrado.');
    if (producto.tipoProducto !== 'Multidosis') {
      throw new BadRequestException('El producto no es de tipo Multidosis.');
    }

    const contenidoEnvase = Number(producto.contenidoDosisPorEnvase || 0);
    if (contenidoEnvase <= 0) {
      throw new BadRequestException('El producto no tiene configurado contenido por envase.');
    }

    let pendienteDosis = cantidadDosis;
    let loteKardexId: string | null = null;

    while (pendienteDosis > 0) {
      const envaseActivo = await envaseRepo.findOne({
        where: {
          idProductoFk: productoId,
          estado: 'Abierto',
        },
        order: { fechaApertura: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (envaseActivo) {
        loteKardexId = envaseActivo.idLoteFk;
        const disponible = Number(envaseActivo.volumenRestante);

        const hoy = new Date();
        if (new Date(envaseActivo.fechaCaducidadAbierto).getTime() < hoy.getTime()) {
          envaseActivo.estado = 'Desechado';
          await envaseRepo.save(envaseActivo);

          await kardexRepo.save(kardexRepo.create({
            idProductoFk: productoId,
            idUsuarioFk: usuarioId,
            tipoMovimiento: 'Ajuste_Inventario',
            cantidad: 0,
            saldoResultante: producto.stockActual,
            motivoDetalle: `Envase abierto desechado por vencimiento (Lote: ${envaseActivo.idLoteFk}).`,
            idLoteFk: envaseActivo.idLoteFk,
            idHistorialFk: idHistorial,
            createdBy: usuarioId,
          }));
          continue;
        }

        if (disponible > 0) {
          const usar = Math.min(disponible, pendienteDosis);
          envaseActivo.volumenRestante = Number((disponible - usar).toFixed(2));
          pendienteDosis = Number((pendienteDosis - usar).toFixed(2));

          if (envaseActivo.volumenRestante <= 0) {
            envaseActivo.estado = 'Agotado';
          }
          await envaseRepo.save(envaseActivo);

          await kardexRepo.save(kardexRepo.create({
            idProductoFk: productoId,
            idUsuarioFk: usuarioId,
            tipoMovimiento: 'Salida_Clinica',
            cantidad: 0,
            saldoResultante: producto.stockActual,
            motivoDetalle: `${motivo} (Consumo dosis: ${usar} ${producto.unidadDosis || 'ml'})`,
            idLoteFk: envaseActivo.idLoteFk,
            idHistorialFk: idHistorial,
            createdBy: usuarioId,
          }));
        }
      } else {
        if (Number(producto.stockActual) <= 0) {
          throw new ConflictException(`Stock insuficiente de envases para [${producto.nombre}]. No se puede abrir un nuevo envase.`);
        }

        const lotes = await loteRepo.find({
          where: { idProductoFk: productoId },
          order: { fechaVencimiento: 'ASC' },
          lock: { mode: 'pessimistic_write' },
        });

        let loteSeleccionado: LoteCaducidad | null = null;
        for (const lote of lotes) {
          if (Number(lote.cantidadActual) > 0) {
            loteSeleccionado = lote;
            break;
          }
        }

        if (!loteSeleccionado) {
          throw new ConflictException(`No hay lotes con stock disponible para abrir un nuevo envase de [${producto.nombre}].`);
        }

        loteSeleccionado.cantidadActual = Number(loteSeleccionado.cantidadActual) - 1;
        loteSeleccionado.updatedBy = usuarioId;
        await loteRepo.save(loteSeleccionado);

        producto.stockActual = Number(producto.stockActual) - 1;
        producto.updatedBy = usuarioId;
        await productoRepo.save(producto);

        loteKardexId = loteSeleccionado.id;

        const hoy = new Date();
        const diasCaducidad = producto.diasCaducidadAbierto || 28;
        const fechaCaducidadAbierto = new Date(hoy.getTime() + (diasCaducidad * 24 * 60 * 60 * 1000));

        const nuevoEnvase = envaseRepo.create({
          idProductoFk: productoId,
          idLoteFk: loteSeleccionado.id,
          volumenRestante: contenidoEnvase,
          fechaApertura: hoy,
          fechaCaducidadAbierto: fechaCaducidadAbierto,
          estado: 'Abierto',
          createdBy: usuarioId,
        });
        await envaseRepo.save(nuevoEnvase);

        await kardexRepo.save(kardexRepo.create({
          idProductoFk: productoId,
          idUsuarioFk: usuarioId,
          tipoMovimiento: 'Ajuste_Inventario',
          cantidad: 1,
          saldoResultante: producto.stockActual,
          motivoDetalle: `Apertura de envase multidosis (Lote: ${loteSeleccionado.numeroLote})`,
          idLoteFk: loteSeleccionado.id,
          idHistorialFk: idHistorial,
          createdBy: usuarioId,
        }));
      }
    }
  }


  private mapToResponse(h: HistorialClinico): HistorialClinicoResponseDto {
    const response: HistorialClinicoResponseDto = {
      id: h.id,
      fecha_consulta: h.fecha_consulta,
      motivo_consulta: h.motivo_consulta,
      sintomas: h.sintomas ?? undefined,
      diagnostico: h.diagnostico,
      notas_internas: h.notas_internas ?? undefined,
      estado: h.estado,
      peso_actual_kg: Number(h.peso_kg),
      temperatura_c: Number(h.temperatura_c),
      frecuencia_cardiaca: Number(h.frecuencia_cardiaca),
      frecuencia_respiratoria: Number(h.frecuencia_respiratoria),
      tipo_atencion: h.tipo_atencion,
      triaje_completado: h.triaje_completado,
      veterinario: h.veterinario ? {
        id: h.veterinario.id,
        nombres: h.veterinario.nombres,
        apellidos: h.veterinario.apellidos,
        email: h.veterinario.email,
      } : undefined,
      mascota: h.cita && h.cita.mascota ? {
        id: h.cita.mascota.id,
        nombre: h.cita.mascota.nombre,
        sexo: h.cita.mascota.sexo,
      } : (h.expediente && h.expediente.mascota ? {
        id: h.expediente.mascota.id,
        nombre: h.expediente.mascota.nombre,
        sexo: h.expediente.mascota.sexo,
      } : undefined),
      cita: h.cita ? {
        id: h.cita.id,
        estado: h.cita.estado,
      } : undefined,
    };

    if (h.recetas) {
      response.recetas = h.recetas.map(r => ({
        id: r.id,
        indicaciones_grales: r.indicacionesGrales,
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
      }));
    }

    if (h.vacunasAplicadas) {
      response.vacunas_aplicadas = h.vacunasAplicadas.map(v => ({
        id: v.id,
        fecha_aplicacion: v.fechaAplicacion,
        fecha_proxima_dosis: v.fechaProximaDosis ?? undefined,
        peso_mascota_kg: v.pesoMascotaKg ? Number(v.pesoMascotaKg) : undefined,
        lote_vacuna: v.loteVacuna ?? undefined,
        vacuna: v.vacuna ? {
          id: v.vacuna.id,
          nombre: v.vacuna.nombre,
        } : undefined,
      }));
    }

    return response;
  }

  async findPendientesCobro(): Promise<any[]> {
    const historiales = await this.historialRepository.find({
      where: { estado: 'Cerrado' },
      relations: ['expediente', 'expediente.mascota', 'expediente.mascota.dueno', 'veterinario', 'cita'],
      order: { fecha_consulta: 'DESC' },
    });
    return historiales.map(h => ({
      id: h.id,
      fecha_consulta: h.fecha_consulta,
      tipo_atencion: h.tipo_atencion,
      diagnostico: h.diagnostico,
      mascota: h.expediente?.mascota ? { id: h.expediente.mascota.id, nombre: h.expediente.mascota.nombre } : null,
      dueno: h.expediente?.mascota?.dueno ? {
        nombres: h.expediente.mascota.dueno.nombres,
        apellidos: h.expediente.mascota.dueno.apellidos,
        telefono: (h.expediente.mascota.dueno as any).telefono,
      } : null,
      veterinario: h.veterinario ? { nombres: h.veterinario.nombres, apellidos: h.veterinario.apellidos } : null,
    }));
  }

  async findAll(mascotaId?: string, before?: string): Promise<HistorialClinicoResponseDto[]> {
    const qb = this.historialRepository.createQueryBuilder('h')
      .leftJoinAndSelect('h.expediente', 'expediente')
      .leftJoinAndSelect('expediente.mascota', 'mascota')
      .leftJoinAndSelect('h.veterinario', 'veterinario')
      .leftJoinAndSelect('h.cita', 'cita')
      .leftJoinAndSelect('cita.mascota', 'citaMascota')
      .leftJoinAndSelect('h.recetas', 'recetas')
      .leftJoinAndSelect('recetas.detalles', 'detalles')
      .leftJoinAndSelect('detalles.producto', 'producto')
      .leftJoinAndSelect('h.vacunasAplicadas', 'vacunasAplicadas')
      .leftJoinAndSelect('vacunasAplicadas.vacuna', 'vacuna')
      .leftJoinAndSelect('h.archivosAdjuntos', 'archivosAdjuntos')
      .orderBy('h.fecha_consulta', 'DESC');

    if (mascotaId) {
      qb.where('mascota.id = :mascotaId', { mascotaId });
    }

    if (before) {
      const fechaLimite = new Date(before);
      const condition = mascotaId ? 'andWhere' : 'where';
      qb[condition]('h.fecha_consulta < :before', { before: fechaLimite });
    }

    const historiales = await qb.getMany();
    return historiales.map(h => this.mapToResponse(h));
  }

  async findOne(id: string): Promise<HistorialClinicoResponseDto> {
    const historial = await this.historialRepository.findOne({
      where: { id },
      relations: [
        'expediente',
        'expediente.mascota',
        'veterinario',
        'cita',
        'cita.mascota',
        'recetas',
        'recetas.detalles',
        'recetas.detalles.producto',
        'vacunasAplicadas',
        'vacunasAplicadas.vacuna',
      ],
    });

    if (!historial) {
      throw new NotFoundException(`El historial clínico no existe.`);
    }

    return this.mapToResponse(historial);
  }

  async update(id: string, updateDto: UpdateHistorialClinicoDto, usuarioId: string): Promise<HistorialClinicoResponseDto> {
    const historial = await this.historialRepository.findOne({ 
      where: { id },
      relations: ['expediente', 'expediente.mascota', 'veterinario', 'cita', 'cita.mascota'] 
    });
    if (!historial) throw new NotFoundException('Historial clínico no encontrado');

    // Regla de Oro: El diagnóstico no se toca una vez guardado
    // (Por seguridad lógica si se llegase a cambiar, aunque el DTO ya no lo tiene)
    if ((updateDto as any).diagnostico && (updateDto as any).diagnostico !== historial.diagnostico) {
      throw new BadRequestException('El diagnóstico principal es inmutable por razones legales.');
    }

    if (updateDto.notas_internas) {
      if (historial.estado === 'Cerrado' || historial.estado === 'Facturado') {
        const fechaAclaracion = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });
        const addendum = `\n\n[ACLARACIÓN - ${fechaAclaracion} por Vet ID: ${usuarioId}]: ${updateDto.notas_internas}`;
        historial.notas_internas = (historial.notas_internas || '') + addendum;
      } else {
        historial.notas_internas = updateDto.notas_internas;
      }
    }
    historial.updatedBy = usuarioId;
    
    const historialGuardado = await this.historialRepository.save(historial);
    return this.findOne(historialGuardado.id);
  }

  async desactivar(id: string): Promise<void> {
    const historial = await this.historialRepository.findOne({ where: { id } });
    if (!historial) {
      throw new NotFoundException(`El historial clínico no existe.`);
    }
    await this.historialRepository.softDelete(historial.id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RF-25 | HU-28 — Portal cliente: expediente COMPLETO de su mascota
  // El dueño tiene derecho a ver todo el historial médico de su mascota.
  // Único campo oculto: notas_internas (anotaciones privadas del veterinario).
  // ─────────────────────────────────────────────────────────────────────────
  async findExpedienteCompleto(mascotaId: string, clienteId: string): Promise<any> {
    // 1. Verificar que la mascota pertenece al cliente autenticado
    const mascota = await this.mascotaRepository.findOne({
      where: { id: mascotaId },
      relations: ['raza', 'raza.especie'],
    });
    if (!mascota) throw new NotFoundException('Mascota no encontrada.');
    if (mascota.id_dueno_fk !== clienteId) {
      throw new NotFoundException('No tienes acceso al expediente de esta mascota.');
    }

    // 2. Obtener el expediente
    const expediente = await this.expedienteRepository.findOne({
      where: { id_mascota_fk: mascotaId },
    });

    if (!expediente) {
      return {
        mascota: this.mapMascotaPublica(mascota),
        expediente: null,
        historiales: [],
      };
    }

    // 3. Traer TODOS los historiales con TODAS las relaciones clínicas
    const historiales = await this.historialRepository.find({
      where: { id_expediente_fk: expediente.id },
      relations: [
        'veterinario',
        'cita',
        'cita.servicio',
        // Recetas completas con medicamentos
        'recetas',
        'recetas.detalles',
        'recetas.detalles.producto',
        // Vacunas aplicadas en consulta
        'vacunasAplicadas',
        'vacunasAplicadas.vacuna',
        // Hospitalización vinculada a la consulta
        'hospitalizacion',
        'hospitalizacion.vacunasAplicadas',
        'hospitalizacion.vacunasAplicadas.vacuna',
        'hospitalizacion.insumos',
        'hospitalizacion.insumos.producto',
        'hospitalizacion.insumos.servicio',
        'hospitalizacion.archivos',
        // Archivos adjuntos de la consulta
        'archivosAdjuntos',
      ],
      order: { fecha_consulta: 'DESC' },
    });

    // 4. Para cada hospitalización, traer el monitoreo diario
    const hospitalizacionIds = historiales
      .map(h => h.hospitalizacion?.id)
      .filter(Boolean) as string[];

    const monitoreos = hospitalizacionIds.length > 0
      ? await this.monitoreoRepository
          .createQueryBuilder('m')
          .leftJoinAndSelect('m.veterinario', 'vet')
          .where('m.id_hospitaliza_fk IN (:...ids)', { ids: hospitalizacionIds })
          .orderBy('m.createdAt', 'ASC')
          .getMany()
      : [];

    // Agrupar monitoreos por hospitalización para acceso rápido
    const monitoreoMap: Record<string, MonitoreoDiario[]> = {};
    for (const m of monitoreos) {
      if (!monitoreoMap[m.id_hospitaliza_fk]) monitoreoMap[m.id_hospitaliza_fk] = [];
      monitoreoMap[m.id_hospitaliza_fk].push(m);
    }

    // 5. Mapear el expediente completo
    return {
      mascota: this.mapMascotaPublica(mascota),
      expediente: {
        id: expediente.id,
        fecha_apertura: expediente.fecha_apertura,
        notas_generales: expediente.notas_generales,
      },
      historiales: historiales.map(h => ({
        id: h.id,
        fecha_consulta: h.fecha_consulta,
        tipo_atencion: h.tipo_atencion,
        motivo_consulta: h.motivo_consulta,
        sintomas: h.sintomas ?? null,
        diagnostico: h.diagnostico,
        // notas_internas: OMITIDO — es privado del veterinario
        estado: h.estado,
        triaje: {
          peso_kg: Number(h.peso_kg),
          temperatura_c: Number(h.temperatura_c),
          frecuencia_cardiaca: h.frecuencia_cardiaca,
          frecuencia_respiratoria: h.frecuencia_respiratoria,
        },
        veterinario: h.veterinario
          ? `Dr(a). ${h.veterinario.nombres} ${h.veterinario.apellidos}`
          : null,
        fecha_agendada: h.cita?.fecha_hora_inicio ?? null,
        servicio: h.cita?.servicio?.nombre ?? null,

        recetas: (h.recetas ?? []).map(r => ({
          id: r.id,
          indicaciones_grales: r.indicacionesGrales,
          medicamentos: (r.detalles ?? []).map(d => ({
            medicamento: d.producto?.nombre ?? d.medicamentoTexto ?? 'Desconocido',
            dosis: d.dosis,
            frecuencia: d.frecuencia,
            duracion_dias: d.duracionDias ?? null,
          })),
        })),

        vacunas_aplicadas: (h.vacunasAplicadas ?? []).map(v => ({
          vacuna: v.vacuna?.nombre ?? 'Desconocida',
          fecha_aplicacion: v.fechaAplicacion,
          proxima_dosis: v.fechaProximaDosis ?? null,
          peso_al_aplicar: v.pesoMascotaKg ? Number(v.pesoMascotaKg) : null,
        })),

        archivos_adjuntos: (h.archivosAdjuntos ?? []).map(a => ({
          id: a.id,
          nombre: a.nombreArchivo ?? null,
          tipo_estudio: a.tipoEstudio,
          url: a.urlArchivo,
          fecha_estudio: a.fechaEstudio ?? null,
        })),

        hospitalizacion: h.hospitalizacion ? {
          id: h.hospitalizacion.id,
          motivo_ingreso: h.hospitalizacion.motivoIngreso,
          fecha_ingreso: h.hospitalizacion.fechaIngreso,
          fecha_alta: h.hospitalizacion.fechaAlta ?? null,
          estado: h.hospitalizacion.estadoActual,
          vacunas_durante_internacion: (h.hospitalizacion.vacunasAplicadas ?? []).map(v => ({
            vacuna: v.vacuna?.nombre ?? 'Desconocida',
            fecha_aplicacion: v.fechaAplicacion,
            proxima_dosis: v.fechaProximaDosis ?? null,
          })),
          insumos_utilizados: (h.hospitalizacion.insumos ?? []).map(i => ({
            nombre: i.producto?.nombre ?? i.servicio?.nombre ?? 'Desconocido',
            cantidad: i.cantidad,
            tipo: i.producto ? 'Producto' : 'Servicio',
          })),
          monitoreo_diario: (monitoreoMap[h.hospitalizacion.id] ?? []).map(m => ({
            turno: m.turno,
            fecha: m.createdAt,
            temperatura_c: m.temperaturaC ?? null,
            frecuencia_cardiaca: m.freqCardiaca ?? null,
            frecuencia_respiratoria: m.freqRespiratoria ?? null,
            observaciones: m.observaciones,
            veterinario: m.veterinario
              ? `Dr(a). ${m.veterinario.nombres} ${m.veterinario.apellidos}`
              : null,
          })),
          archivos_adjuntos: (h.hospitalizacion.archivos ?? []).map(a => ({
            id: a.id,
            nombre: a.nombreArchivo ?? null,
            tipo_estudio: a.tipoEstudio,
            url: a.urlArchivo,
          })),
        } : null,
      })),
    };
  }

  private mapMascotaPublica(mascota: Mascota): any {
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
      especie: (mascota as any).raza?.especie?.nombre ?? 'Desconocida',
      raza: (mascota as any).raza?.nombre ?? 'Desconocida',
    };
  }

  private async generarPdfRecetaBuffer(
    cita: Cita,
    hc: HistorialClinico,
    receta: Receta,
    detalles: DetallesReceta[],
    dueno: any,
    veterinario: any,
  ): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', data => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const AZUL = '#1a3a5c';
      const GRIS = '#555555';
      const LINEA = '#dddddd';

      doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(24).text('Animal Vet', 40, 40);
      doc.fontSize(10).font('Helvetica').fillColor(GRIS).text('Clínica Veterinaria & Farmacia', 40, 68);
      
      doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(10)
        .text(`Dr(a). ${veterinario.nombres} ${veterinario.apellidos}`, 350, 40, { align: 'right' })
        .font('Helvetica').fillColor(GRIS)
        .text('Atención Veterinaria Profesional', 350, 52, { align: 'right' })
        .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 350, 64, { align: 'right' });

      doc.moveTo(40, 85).lineTo(550, 85).strokeColor(AZUL).lineWidth(2).stroke();

      doc.font('Helvetica-Bold').fontSize(16).fillColor(AZUL).text('RECETA MÉDICA', 40, 110, { align: 'center', characterSpacing: 1 });

      let y = 145;
      doc.fillColor('#f9f9f9').rect(40, y, 510, 85).fill();
      doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(10)
        .text('DATOS DEL PACIENTE', 50, y + 10)
        .text('DIAGNÓSTICO', 300, y + 10);
      
      doc.fillColor(GRIS).font('Helvetica').fontSize(9)
        .text(`Nombre: ${cita.mascota?.nombre || '—'}`, 50, y + 25)
        .text(`Especie/Raza: ${(cita.mascota as any)?.raza?.especie?.nombre || '—'} / ${(cita.mascota as any)?.raza?.nombre || '—'}`, 50, y + 40)
        .text(`Propietario: ${dueno ? `${dueno.nombres} ${dueno.apellidos}` : '—'}`, 50, y + 55);

      doc.fillColor('#333333')
        .text(hc.diagnostico || 'Consulta general.', 300, y + 25, { width: 230 });

      y = 250;
      doc.fillColor(AZUL).rect(40, y, 510, 20).fill();
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9)
        .text('Medicamento', 50, y + 6)
        .text('Dosis', 220, y + 6)
        .text('Frecuencia', 340, y + 6)
        .text('Duración', 460, y + 6);

      y += 20;
      doc.fillColor('#333333').font('Helvetica').fontSize(9);
      for (const d of detalles) {
        const nombreMed = d.producto?.nombre ?? d.medicamentoTexto ?? 'Desconocido';
        const duracion = d.duracionDias ? `${d.duracionDias} días` : 'N/A';

        doc.moveTo(40, y + 20).lineTo(550, y + 20).strokeColor(LINEA).lineWidth(0.5).stroke();

        doc.text(nombreMed, 50, y + 6, { width: 160 })
          .text(d.dosis, 220, y + 6, { width: 110 })
          .text(d.frecuencia, 340, y + 6, { width: 110 })
          .text(duracion, 460, y + 6, { width: 80 });
        
        y += 20;
      }

      if (receta.indicacionesGrales) {
        y += 20;
        doc.fillColor('#fffde7').rect(40, y, 510, 45).fill();
        doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(9).text('Indicaciones adicionales:', 50, y + 8);
        doc.fillColor('#333333').font('Helvetica').fontSize(8.5).text(receta.indicacionesGrales, 50, y + 20, { width: 490 });
        y += 45;
      }

      y = 650;
      doc.moveTo(350, y).lineTo(500, y).strokeColor(GRIS).lineWidth(0.75).stroke();
      doc.fillColor(GRIS).font('Helvetica').fontSize(9)
        .text(`Dr(a). ${veterinario.nombres} ${veterinario.apellidos}`, 350, y + 5, { width: 150, align: 'center' })
        .text('Firma y Sello', 350, y + 17, { width: 150, align: 'center' });

      doc.fontSize(8).fillColor('#999999').text('Documento emitido de manera digital por el sistema de gestión de Animal Vet.', 40, 750, { align: 'center' });

      doc.end();
    });
  }
}
