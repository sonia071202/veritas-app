import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const tokenCookie = request.headers.get('cookie')
    ?.split(';')
    .find(c => c.trim().startsWith('token='));
  
  const token = tokenCookie ? tokenCookie.split('=')[1] : null;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    }
  });
}
