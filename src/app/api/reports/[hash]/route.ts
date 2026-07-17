import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    const cleanHash = hash.trim().toLowerCase();

    const report = await db.mediaReport.findUnique({
      where: { hash: cleanHash },
      include: {
        analyst: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Forensic report not found' }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error: unknown) {
    console.error('Fetch report detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    const cleanHash = hash.trim().toLowerCase();

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
      return NextResponse.json({ error: 'Administrative scope credentials required' }, { status: 403 });
    }

    const { status, confidence } = await request.json();

    const existing = await db.mediaReport.findUnique({ where: { hash: cleanHash } });
    if (!existing) {
      return NextResponse.json({ error: 'Forensic report not found' }, { status: 404 });
    }

    const updated = await db.mediaReport.update({
      where: { hash: cleanHash },
      data: {
        status: status || existing.status,
        confidence: typeof confidence === 'number' ? confidence : existing.confidence,
      },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'REPORT_REVOKE',
        details: `Updated report (${cleanHash}) status from ${existing.status} to ${updated.status}. Rated authenticity: ${updated.confidence}%`,
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error: unknown) {
    console.error('Update report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await params;
    const cleanHash = hash.trim().toLowerCase();

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
      return NextResponse.json({ error: 'Administrative scope credentials required' }, { status: 403 });
    }

    const existing = await db.mediaReport.findUnique({ where: { hash: cleanHash } });
    if (!existing) {
      return NextResponse.json({ error: 'Forensic report not found' }, { status: 404 });
    }

    await db.mediaReport.delete({ where: { hash: cleanHash } });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'REPORT_DELETE',
        details: `Deleted media report from ledger: ${cleanHash} (${existing.fileName})`,
      },
    });

    return NextResponse.json({ success: true, message: 'Report purged from ledger successfully' });
  } catch (error: unknown) {
    console.error('Delete report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
