import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hashValue = searchParams.get('hash');

    if (!hashValue) {
      return NextResponse.json({ error: 'Hash query parameter is missing' }, { status: 400 });
    }

    // Clean hash input, converting to lowercase
    const cleanHash = hashValue.trim().toLowerCase();

    const report = await db.mediaReport.findUnique({
      where: { hash: cleanHash },
      include: {
        analyst: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({
        found: false,
        message: 'No forensic ledger record corresponds to this cryptographic identifier.',
      }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      report,
    });
  } catch (error: any) {
    console.error('Hash query error:', error);
    return NextResponse.json({ error: 'Internal server query error occurred' }, { status: 500 });
  }
}
