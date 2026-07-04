import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, Between, MoreThan } from 'typeorm';
import { CatalogoVacuna } from '../../core/catalogo_vacunas/entities/catalogo_vacuna.entity';
import { Producto } from '../../inventario/productos/entities/producto.entity';
import { KardexInventario } from '../../inventario/kardex_inventario/entities/kardex_inventario.entity';
import { LoteCaducidad } from '../../inventario/lotes_caducidad/entities/lotes_caducidad.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { Hospitalizacion } from '../hospitalizaciones/entities/hospitalizacione.entity';
import { CreateVacunasAplicadaDto } from './dto/create-vacunas_aplicada.dto';
import { UpdateVacunasAplicadaDto } from './dto/update-vacunas_aplicada.dto';
import { VacunasAplicadasResponseDto } from './dto/vacunas_aplicadas-response.dto';
import { VacunaAplicada } from './entities/vacunas_aplicada.entity';

@Injectable()
export class VacunasAplicadasService {
  constructor(
    @InjectRepository(VacunaAplicada)
    private readonly vacunaRepo: Repository<VacunaAplicada>,
    private readonly dataSource: DataSource,
  ) {}

  private getBoliviaDate(): Date {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(new Date());
    const year = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
    const month = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10) - 1;
    const day = parseInt(parts.find((p) => p.type === 'day')?.value || '0', 10);
    return new Date(Date.UTC(year, month, day));
  }

  private parseLocalDateAsUTCDate(dateString: string): Date {
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    }
    return new Date(dateString);
  }

  private mapToResponse(v: VacunaAplicada): VacunasAplicadasResponseDto {
    return {
      id: v.id,
      fecha_aplicacion: v.fechaAplicacion,
      fecha_proxima_dosis: v.fechaProximaDosis ?? undefined,
      peso_mascota_kg: v.pesoMascotaKg ? Number(v.pesoMascotaKg) : undefined,
      lote_vacuna: v.loteVacuna ?? undefined,
      vacuna: v.vacuna ? {
        id: v.vacuna.id,
        nombre: v.vacuna.nombre,
        diasParaRefuerzo: v.vacuna.diasParaRefuerzo,
      } : undefined,
      veterinario: v.veterinario ? {
        id: v.veterinario.id,
        nombres: v.veterinario.nombres,
        apellidos: v.veterinario.apellidos,
        email: v.veterinario.email,
      } : undefined,
    };
  }

  private async findEntity(id: string): Promise<VacunaAplicada> {
    const vacuna = await this.vacunaRepo.findOne({
      where: { id },
      relations: ['vacuna', 'veterinario', 'historial'],
    });
    if (!vacuna) throw new NotFoundException(`Vacuna aplicada con ID ${id} no encontrada.`);
    return vacuna;
  }

  async create(createDto: CreateVacunasAplicadaDto, creatorId: string): Promise<VacunasAplicadasResponseDto> {
    const guardada = await this.dataSource.transaction(async (manager) => {
      let fallbackPeso: number | null = null;
      let fallbackVeterinarioId: string = creatorId;

      if (createDto.id_historial_fk) {
        const historial = await manager.getRepository(HistorialClinico).findOne({ where: { id: createDto.id_historial_fk } });
        if (!historial) throw new NotFoundException('Historial clinico no encontrado.');
        if (historial.estado !== 'Abierto') {
          throw new BadRequestException('Solo se pueden registrar vacunas en historiales clinicos abiertos.');
        }
        fallbackPeso = historial.peso_kg ? Number(historial.peso_kg) : null;
        fallbackVeterinarioId = historial.id_veterinario_fk ?? creatorId;
      } else if (createDto.id_hospitalizacion_fk) {
        const hospitalizacion = await manager.getRepository(Hospitalizacion).findOne({
          where: { id: createDto.id_hospitalizacion_fk },
          relations: ['historial'],
        });
        if (!hospitalizacion) throw new NotFoundException('Hospitalizacion no encontrada.');
        if (hospitalizacion.estadoActual === 'Alta') {
          throw new BadRequestException('No se pueden agregar vacunas a una hospitalizacion con alta medica.');
        }
        fallbackPeso = hospitalizacion.historial?.peso_kg ? Number(hospitalizacion.historial.peso_kg) : null;
        fallbackVeterinarioId = hospitalizacion.id_veterinario_responsable ?? creatorId;
      } else {
        throw new BadRequestException('Debe proporcionar obligatoriamente un id_historial_fk o un id_hospitalizacion_fk.');
      }

      const catalogoVacuna = await manager.getRepository(CatalogoVacuna).findOne({
        where: { id: createDto.id_vacuna_fk },
        relations: ['producto'],
      });
      if (!catalogoVacuna) throw new NotFoundException(`Vacuna con ID ${createDto.id_vacuna_fk} no encontrada en el catalogo.`);

      if (catalogoVacuna.producto) {
        await this.descontarProductoClinico(
          manager,
          catalogoVacuna.producto.id,
          1,
          creatorId,
          `Aplicacion de vacuna ${catalogoVacuna.nombre}`,
          createDto.id_historial_fk ?? null,
        );
      }

      const fechaAplicacion = createDto.fecha_aplicacion ? this.parseLocalDateAsUTCDate(createDto.fecha_aplicacion) : this.getBoliviaDate();
      let fechaProximaDosis: Date | null = null;
      if (createDto.fecha_proxima_dosis) {
        fechaProximaDosis = this.parseLocalDateAsUTCDate(createDto.fecha_proxima_dosis);
      } else if (catalogoVacuna.diasParaRefuerzo > 0) {
        fechaProximaDosis = new Date(fechaAplicacion.getTime());
        fechaProximaDosis.setUTCDate(fechaProximaDosis.getUTCDate() + catalogoVacuna.diasParaRefuerzo);
      }

      const nuevaVacuna = manager.getRepository(VacunaAplicada).create({
        id_historial_fk: createDto.id_historial_fk ?? null,
        id_hospitalizacion_fk: createDto.id_hospitalizacion_fk ?? null,
        id_vacuna_fk: createDto.id_vacuna_fk,
        id_veterinario_fk: createDto.id_veterinario_fk ?? fallbackVeterinarioId,
        fechaAplicacion,
        fechaProximaDosis,
        pesoMascotaKg: createDto.peso_mascota_kg ?? fallbackPeso,
        loteVacuna: createDto.lote_vacuna,
        createdBy: creatorId,
      });

      return manager.getRepository(VacunaAplicada).save(nuevaVacuna);
    });

    return this.findOne(guardada.id);
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

  async findByHistorial(idHistorial: string): Promise<VacunasAplicadasResponseDto[]> {
    const vacunas = await this.vacunaRepo.find({
      where: { id_historial_fk: idHistorial },
      relations: ['vacuna', 'veterinario'],
      order: { fechaAplicacion: 'DESC' },
    });
    return vacunas.map((v) => this.mapToResponse(v));
  }

  async findOne(id: string): Promise<VacunasAplicadasResponseDto> {
    const entity = await this.vacunaRepo.findOne({
      where: { id },
      relations: ['vacuna', 'veterinario'],
    });
    if (!entity) throw new NotFoundException(`Vacuna aplicada con ID ${id} no encontrada.`);
    return this.mapToResponse(entity);
  }

  async update(id: string, updateDto: UpdateVacunasAplicadaDto, updaterId: string): Promise<VacunasAplicadasResponseDto> {
    const vacuna = await this.findEntity(id);
    if (updateDto.fecha_proxima_dosis !== undefined) {
      vacuna.fechaProximaDosis = updateDto.fecha_proxima_dosis ? this.parseLocalDateAsUTCDate(updateDto.fecha_proxima_dosis) : null;
    }
    if (updateDto.peso_mascota_kg !== undefined) vacuna.pesoMascotaKg = updateDto.peso_mascota_kg;
    if (updateDto.lote_vacuna !== undefined) vacuna.loteVacuna = updateDto.lote_vacuna;
    vacuna.updatedBy = updaterId;

    const guardada = await this.vacunaRepo.save(vacuna);
    return this.findOne(guardada.id);
  }

  async remove(id: string): Promise<{ mensaje: string }> {
    const vacuna = await this.findEntity(id);
    await this.vacunaRepo.softRemove(vacuna);
    return { mensaje: 'Registro de vacuna aplicada eliminado correctamente.' };
  }

  async obtenerAlertasProximas(usuarioId: string, rol: string): Promise<any[]> {
    const today = this.getBoliviaDate();
    const startDate = new Date(today.getTime());
    startDate.setUTCDate(startDate.getUTCDate() - 30); // 30 días antes
    const endDate = new Date(today.getTime());
    endDate.setUTCDate(endDate.getUTCDate() + 30); // 30 días después

    const allUpcoming = await this.vacunaRepo.find({
      where: {
        fechaProximaDosis: Between(startDate, endDate),
      },
      relations: [
        'vacuna',
        'veterinario',
        'historial',
        'historial.expediente',
        'historial.expediente.mascota',
        'historial.expediente.mascota.dueno',
        'hospitalizacion',
        'hospitalizacion.mascota',
        'hospitalizacion.mascota.dueno',
      ],
    });

    const result: VacunaAplicada[] = [];

    for (const v of allUpcoming) {
      const pet = v.historial?.expediente?.mascota || v.hospitalizacion?.mascota;
      if (!pet) continue;
      const petId = pet.id;

      // Check if there is a newer application for this pet and this vaccine
      const hasNewer = await this.vacunaRepo.findOne({
        where: [
          {
            id_vacuna_fk: v.id_vacuna_fk,
            fechaAplicacion: MoreThan(v.fechaAplicacion),
            historial: { expediente: { id_mascota_fk: petId } },
          },
          {
            id_vacuna_fk: v.id_vacuna_fk,
            fechaAplicacion: MoreThan(v.fechaAplicacion),
            hospitalizacion: { id_mascota_fk: petId },
          },
        ],
      });

      if (!hasNewer) {
        result.push(v);
      }
    }

    // Filter by owner if role is Cliente
    const filteredResult = result.filter((v) => {
      if (rol === 'Cliente') {
        const duenoId = v.historial?.expediente?.mascota?.id_dueno_fk || v.hospitalizacion?.mascota?.id_dueno_fk;
        return duenoId === usuarioId;
      }
      return true;
    });

    // Map to response format
    return filteredResult.map((v) => {
      const pet = v.historial?.expediente?.mascota || v.hospitalizacion?.mascota;
      const dueno = pet?.dueno;
      const proximaDate = v.fechaProximaDosis ? new Date(v.fechaProximaDosis) : null;
      let diasRestantes: number | null = null;
      if (proximaDate) {
        const diffTime = proximaDate.getTime() - today.getTime();
        diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: v.id,
        fecha_proxima_dosis: v.fechaProximaDosis,
        dias_restantes: diasRestantes,
        vacuna: v.vacuna ? {
          id: v.vacuna.id,
          nombre: v.vacuna.nombre,
        } : undefined,
        mascota: pet ? {
          id: pet.id,
          nombre: pet.nombre,
          dueno: dueno ? {
            id: dueno.id,
            nombres: dueno.nombres,
            apellidos: dueno.apellidos,
            telefono: dueno.telefono ?? undefined,
          } : undefined,
        } : undefined,
      };
    });
  }
}
