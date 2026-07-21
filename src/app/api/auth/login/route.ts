import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const expectedPIN = process.env.ACCESS_PIN || '3340';

    if (pin === expectedPIN) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('auth_pin_token', expectedPIN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'PIN incorrecto' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
  }
}
