import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateForensicReport } from '@/lib/gemini';

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
    if (!user) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter: {
      status?: string;
      OR?: Array<{ fileName: { contains: string } } | { hash: { contains: string } }>;
    } = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search) {
      filter.OR = [
        { fileName: { contains: search } },
        { hash: { contains: search } },
      ];
    }

    const reports = await db.mediaReport.findMany({
      where: filter,
      orderBy: { registration: 'desc' },
      include: {
        analyst: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ reports });
  } catch (error: unknown) {
    console.error('List reports processing error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    if (!user || !['ADMIN', 'ANALYST'].includes(user.role)) {
      return NextResponse.json({ error: 'Administrative scope or analyst credentials required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      fileName,
      fileSize,
      mimeType,
      hash,
      audioJitter,
      visualAnomalies,
      metadataStatus,
      compressionProfile,
      confidence,
      status,
    } = body;

    if (!fileName || (fileSize === undefined || fileSize === null || fileSize === '') || !mimeType || !hash) {
      return NextResponse.json({ error: 'Missing required file details (name, size, type, or hash)' }, { status: 400 });
    }

    const cleanHash = hash.trim().toLowerCase();

    // Check pre-registered DB records
    const existing = await db.mediaReport.findUnique({
      where: { hash: cleanHash },
    });

    if (existing) {
      return NextResponse.json({ error: 'This cryptographic file hash signature matches a pre-existing ledger entry.' }, { status: 409 });
    }

    // Map defaults
    const scoreAudio = typeof audioJitter === 'number' ? audioJitter : 0;
    const scoreVisual = typeof visualAnomalies === 'number' ? visualAnomalies : 0;
    const metaText = metadataStatus || 'CLEAN';
    const compText = compressionProfile || 'STANDARD';
    const overallConfidence = typeof confidence === 'number' ? confidence : 100;
    const finalStatus = status || (overallConfidence < 70 ? 'SUSPICIOUS' : 'VERIFIED');

    // Run Forensic AI Audit (utilizing Gemini API / falling back on mock report)
    const reportText = await generateForensicReport({
      fileName,
      mimeType,
      hash: cleanHash,
      audioJitter: scoreAudio,
      visualAnomalies: scoreVisual,
      metadataStatus: metaText,
      compressionProfile: compText,
      confidence: overallConfidence,
    });

    // Create Report
    const report = await db.mediaReport.create({
      data: {
        hash: cleanHash,
        fileName,
        fileSize: typeof fileSize === 'number' ? fileSize : (parseInt(fileSize) || 0),
        mimeType,
        analystId: user.userId,
        audioJitter: scoreAudio,
        visualAnomalies: scoreVisual,
        metadataStatus: metaText,
        compressionProfile: compText,
        confidence: overallConfidence,
        status: finalStatus,
        aiReport: reportText,
      },
    });

    // Write audit trail
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'REPORT_CREATE',
        details: `Registered media report: ${cleanHash} (${fileName}). Authenticity Rating: ${overallConfidence}%. Verdict: ${finalStatus}`,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    console.error('Create report processing error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
