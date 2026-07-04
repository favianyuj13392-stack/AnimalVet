import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { BaseCrudService } from '../../../compartido/utils/base-crud.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService extends BaseCrudService<Role> {
  constructor(@InjectRepository(Role) private readonly roleRepository: Repository<Role>) {
    super(roleRepository, 'Rol');
  }

  async createRole(createRoleDto: CreateRoleDto) {
    return super.create(createRoleDto, { key: 'nombre' as keyof Role, value: createRoleDto.nombre });
  }
}