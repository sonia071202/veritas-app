import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required credential inputs' }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email address already in use' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = role && ['ADMIN', 'ANALYST', 'AUDITOR'].includes(role) ? role : 'ANALYST';

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: assignedRole,
      },
    });

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

    // Log the user registration event
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTER',
        details: `Registered account ${user.email} under role ${user.role}`,
      },
    });

    return response;
  } catch (error: any) {
    console.error('Registration processing error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
