import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Aceptamos un array de strings (ej: 'Administrador', 'Veterinario')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);