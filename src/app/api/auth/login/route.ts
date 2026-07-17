import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePasswords, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await comparePasswords(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    // Logging login event
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: `Logged in from IP or terminal. Role: ${user.role}`,
      },
    });

    return response;
  } catch (error: any) {
    console.error('Login processing error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
