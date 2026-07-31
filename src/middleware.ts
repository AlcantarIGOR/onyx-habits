import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function generateSecureToken(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_mi_espacio_secure_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, login page, robots.txt and login API without check
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth/login') ||
    pathname === '/robots.txt' ||
    pathname.includes('.') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_pin_token')?.value;
  const expectedPIN = process.env.ACCESS_PIN || '3340';
  const expectedToken = await generateSecureToken(expectedPIN);

  if (!token || token !== expectedToken) {
    if (pathname.startsWith('/api')) {
      return new NextResponse(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
