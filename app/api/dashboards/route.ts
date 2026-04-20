import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const { userId, error } = await requireSession();
  if (error) return error;

  try {
    const dashboards = await prisma.dashboard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        prompt: true,
        theme: true,
        isPublic: true,
        createdAt: true,
        datasetId: true,
        dataset: { select: { name: true, rowCount: true } },
        _count: { select: { charts: true } },
      },
    });

    return NextResponse.json({ dashboards });
  } catch (err) {
    console.error('[GET /api/dashboards]', err);
    return NextResponse.json({ error: 'Failed to fetch dashboards' }, { status: 500 });
  }
}
