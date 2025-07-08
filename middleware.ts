import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Este middleware se ejecuta en cada petición
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Obtenemos la sesión actual del usuario
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión y el usuario intenta acceder a la app principal...
  if (!session && req.nextUrl.pathname.startsWith('/(app)')) {
    // ...lo redirigimos al login.
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Si YA HAY sesión y el usuario intenta acceder a login o signup...
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
     // ...lo redirigimos a la página principal de la app.
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Configuración para que el middleware solo se ejecute en las rutas que nos interesan
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de petición excepto por las que empiezan con:
     * - _next/static (archivos estáticos)
     * - _next/image (imágenes optimizadas)
     * - favicon.ico (el ícono de la pestaña)
     * El objetivo es evitar que el middleware se ejecute en peticiones de assets innecesarias.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};