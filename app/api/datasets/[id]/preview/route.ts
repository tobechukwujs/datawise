import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCSV } from '@/lib/csv-parser';
import { requireSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireSession();
  if (error) return error;

  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: params.id },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (dataset.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!dataset.filePath) {
      return NextResponse.json({ error: 'No file associated with this dataset' }, { status: 400 });
    }

    const res = await fetch(dataset.filePath);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to retrieve CSV file' }, { status: 500 });
    }
    const content = await res.text();
    const { rows } = parseCSV(content);

    return NextResponse.json({
      datasetId: dataset.id,
      name: dataset.name,
      rowCount: dataset.rowCount,
      columns: dataset.columns,
      rows: rows.slice(0, 100),
    });
  } catch (err) {
    console.error('[GET /api/datasets/[id]/preview]', err);
    return NextResponse.json({ error: 'Failed to load preview' }, { status: 500 });
  }
}
