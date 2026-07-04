import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const rutaSolicitada = request.nextUrl.pathname;
  
  // 1. Verificamos si existe el token
  const tieneSesion = request.cookies.has('usuario_token');
  
  // 2. Simulamos obtener el ROL (En el futuro esto vendrá en un JWT decodificado)
  // Por ahora, como estamos en simulación, vamos a fingir que lo leemos
  // de otra cookie o simplemente permitimos todo si hay sesión.
  const rolUsuario = request.cookies.get('usuario_rol')?.value || 'CLIENTE';
  
  const esRutaPrivada = rutaSolicitada.startsWith('/panel') ||
                        rutaSolicitada.startsWith('/cliente') ||
                        rutaSolicitada.startsWith('/admin') ||
                        rutaSolicitada.startsWith('/vet') ||
                        rutaSolicitada.startsWith('/caja');

  // REGLA 1: Si es privada y NO hay sesión -> Al Acceso Denegado
  if (esRutaPrivada && !tieneSesion) {
    return NextResponse.redirect(new URL('/acceso-denegado', request.url));
  }

  // REGLA 2: Protección por rol
  if (rutaSolicitada.startsWith('/admin') && rolUsuario !== 'Administrador') {
    return NextResponse.redirect(new URL('/acceso-denegado', request.url));
  }

  if (rutaSolicitada.startsWith('/vet') && rolUsuario !== 'Veterinario') {
    return NextResponse.redirect(new URL('/acceso-denegado', request.url));
  }

  if (rutaSolicitada.startsWith('/caja') && rolUsuario !== 'Cajero') {
    return NextResponse.redirect(new URL('/acceso-denegado', request.url));
  }

  if (rutaSolicitada.startsWith('/cliente') && rolUsuario !== 'Cliente') {
    return NextResponse.redirect(new URL('/acceso-denegado', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/panel/:path*',
    '/cliente/:path*',
    '/admin/:path*',
    '/vet/:path*',
    '/caja/:path*'
  ],
};