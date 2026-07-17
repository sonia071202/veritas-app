import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const token = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ error: 'Access token cookie missing' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Administrative credentials required' }, { status: 403 });
    }

    const logs = await db.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('List audit logs error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
