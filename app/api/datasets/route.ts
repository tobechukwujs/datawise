import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const { userId, error } = await requireSession();
  if (error) return error;

  try {
    const datasets = await prisma.dataset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        source: true,
        rowCount: true,
        columns: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ datasets });
  } catch (err) {
    console.error('[GET /api/datasets]', err);
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
}
