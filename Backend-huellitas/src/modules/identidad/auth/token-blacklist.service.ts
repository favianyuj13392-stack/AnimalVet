import { Injectable } from '@nestjs/common';

/**
 * Blacklist de tokens JWT inválidos (logout).
 * Usa un Set ESTÁTICO en memoria — garantiza una sola instancia compartida
 * independientemente de cuántas veces NestJS instancie este servicio.
 * Válido para tokens de corta duración (1h): al reiniciar el servidor
 * todos los tokens expirarían en ≤1h de todos modos.
 */
@Injectable()
export class TokenBlacklistService {
  private static readonly blacklist = new Set<string>();

  /** Invalida un token al hacer logout */
  revoke(token: string): void {
    TokenBlacklistService.blacklist.add(token);
  }

  /** Retorna true si el token fue revocado */
  isRevoked(token: string): boolean {
    return TokenBlacklistService.blacklist.has(token);
  }

  /** Versión estática — usada por el guard sin necesidad de DI */
  static check(token: string): boolean {
    return TokenBlacklistService.blacklist.has(token);
  }
}
