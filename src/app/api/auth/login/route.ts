import { NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory rate limiting: max 5 failed attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function generateSecureToken(pin: string): string {
  return crypto
    .createHash('sha256')
    .update(pin + '_mi_espacio_secure_salt_2026')
    .digest('hex');
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const now = Date.now();
    const attemptInfo = loginAttempts.get(ip);

    if (attemptInfo && attemptInfo.resetAt > now && attemptInfo.count >= 5) {
      const minutesLeft = Math.ceil((attemptInfo.resetAt - now) / 60000);
      return NextResponse.json(
        { error: `Demasiados intentos fallidos. Inténtalo de nuevo en ${minutesLeft} min.` },
        { status: 429 }
      );
    }

    const { pin } = await request.json();
    const expectedPIN = process.env.ACCESS_PIN || '3340';

    if (pin === expectedPIN) {
      // Reset rate limit on success
      loginAttempts.delete(ip);

      const secureToken = generateSecureToken(expectedPIN);
      const response = NextResponse.json({ success: true });
      
      response.cookies.set('auth_pin_token', secureToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      return response;
    }

    // Record failed attempt
    const newCount = (attemptInfo && attemptInfo.resetAt > now ? attemptInfo.count : 0) + 1;
    loginAttempts.set(ip, {
      count: newCount,
      resetAt: attemptInfo && attemptInfo.resetAt > now ? attemptInfo.resetAt : now + 15 * 60 * 1000,
    });

    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 400 });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
  }
}
