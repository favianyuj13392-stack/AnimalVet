import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UsuarioResponseDto } from './dto/usuarios-response.dto';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';
import { LogsSistemaService } from '../../core/logs_sistema/logs_sistema.service';

@Injectable()
export class UsuariosService extends BaseCrudService<Usuario> {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly logsService: LogsSistemaService,
  ) {
    super(usuarioRepository, 'Usuario');
  }

  /**
   * Registro de nuevos usuarios con restricción de jerarquía
   */
  async createUsuario(createDto: CreateUsuarioDto, creatorId: string, creatorRol: string): Promise<UsuarioResponseDto> {
    // 1. Jerarquía: Cajero solo crea Clientes (Rol 4)
    if (creatorRol === 'Cajero' && createDto.id_rol_fk !== 4) {
      throw new ForbiddenException('Los cajeros solo pueden registrar clientes.');
    }

    // 2. Evitar correos duplicados
    const existe = await this.usuarioRepository.findOne({ where: { email: createDto.email } });
    if (existe) throw new ConflictException('El correo ya está en uso.');

    // 3. Encriptación de seguridad
    const password_hash = await bcrypt.hash(createDto.password, 12);

    // 4. Guardado en BD
    const { password, ...datos } = createDto;
    const nuevoUsuario = this.usuarioRepository.create({
      ...datos,
      password_hash,
      creador: { id: creatorId } // Mapeo a la relación de auditoría
    });

    const usuarioGuardado = await this.usuarioRepository.save(nuevoUsuario);

    await this.logsService.registrar({
      usuarioId: creatorId,
      accion: 'USUARIO_CREADO',
      categoria: 'SISTEMA',
      tablaAfectada: 'usuarios',
      registroId: usuarioGuardado.id,
      detalles: { email: usuarioGuardado.email, id_rol_fk: usuarioGuardado.id_rol_fk },
    });

    // 5. Devolvemos el DTO limpio
    return UsuarioResponseDto.fromEntity(usuarioGuardado);
  }

  /**
   * Método especial para el AuthModule (Login). 
   * SÍ devuelve la entidad con password_hash porque se necesita para comparar.
   */
  async findByEmailForAuth(email: string): Promise<Usuario | null> {
    return await this.usuarioRepository.createQueryBuilder('usuario')
      .addSelect('usuario.password_hash')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.email = :email', { email })
      .getOne();
  }

  async findByIdForAuth(id: string): Promise<Usuario | null> {
    return await this.usuarioRepository.createQueryBuilder('usuario')
      .addSelect('usuario.password_hash')
      .leftJoinAndSelect('usuario.rol', 'rol')
      .where('usuario.id = :id', { id })
      .getOne();
  }

  async registrarLoginFallido(usuario: Usuario): Promise<void> {
    const intentos = Number(usuario.intentos_fallidos ?? 0) + 1;
    usuario.intentos_fallidos = intentos;
    if (intentos >= 3) {
      usuario.bloqueado_hasta = new Date(Date.now() + 15 * 60 * 1000);
      usuario.estado_cuenta = false;
    }
    await this.usuarioRepository.save(usuario);
  }

  async registrarLoginExitoso(usuario: Usuario): Promise<void> {
    if (usuario.intentos_fallidos !== 0 || usuario.bloqueado_hasta) {
      usuario.intentos_fallidos = 0;
      usuario.bloqueado_hasta = null;
      usuario.estado_cuenta = true;
      await this.usuarioRepository.save(usuario);
    }
  }

  async resetearIntentosFallidos(usuario: Usuario): Promise<void> {
    usuario.intentos_fallidos = 0;
    usuario.bloqueado_hasta = null;
    usuario.estado_cuenta = true;
    await this.usuarioRepository.save(usuario);
  }

  /**
   * Búsqueda por ID con retorno de DTO
   */
  async findOneClean(id: string): Promise<UsuarioResponseDto> {
    const usuario = await this.findOne(id);
    return UsuarioResponseDto.fromEntity(usuario);
  }

  /**
   * Listado general con retorno de DTOs incluyendo eliminados lógicamente
   */
  async findAllClean(): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.usuarioRepository.find({ relations: ['rol'], withDeleted: true });
    return UsuarioResponseDto.fromEntities(usuarios);
  }

  /**
   * Retorna veterinarios activos con datos públicos (sin info sensible)
   */
  async findVeterinariosPublico(): Promise<any[]> {
    const vets = await this.usuarioRepository.find({
      where: { id_rol_fk: 2, estado_cuenta: true },
      relations: ['rol'],
    });

    return vets.map(v => ({
      id:          v.id,
      nombres:     v.nombres,
      apellidos:   v.apellidos,
      avatar_url:  (v as any).avatar_url ?? null,
      rol:         'Veterinario',
    }));
  }

  /**
   * Retorna los usuarios de tipo Cliente (rol 4) incluyendo eliminados lógicamente
   */
  async findClientes(): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.usuarioRepository.find({
      where: { id_rol_fk: 4 },
      relations: ['rol'],
      withDeleted: true
    });
    return UsuarioResponseDto.fromEntities(usuarios);
  }

  /**
   * Retorna los usuarios de personal (cualquier rol distinto de 4) incluyendo eliminados lógicamente
   */
  async findPersonal(): Promise<UsuarioResponseDto[]> {
    const usuarios = await this.usuarioRepository.find({
      where: { id_rol_fk: Not(4) },
      relations: ['rol'],
      withDeleted: true
    });
    return UsuarioResponseDto.fromEntities(usuarios);
  }
  /**
   * Suspensión lógica de cuenta
   */
  async suspenderCuenta(id: string, adminId: string): Promise<UsuarioResponseDto> {
    const usuario = await this.findOne(id);
    usuario.estado_cuenta = false;
    usuario.updated_by = adminId;

    const actualizado = await this.usuarioRepository.save(usuario);
    await this.usuarioRepository.softRemove(actualizado);

    await this.logsService.registrar({
      usuarioId: adminId,
      accion: 'USUARIO_SUSPENDIDO',
      categoria: 'SISTEMA',
      tablaAfectada: 'usuarios',
      registroId: id,
      detalles: { email: usuario.email },
    });

    return UsuarioResponseDto.fromEntity(actualizado);
  }
}
