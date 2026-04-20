import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { parseCSV } from '@/lib/csv-parser';
import { requireSession } from '@/lib/session';

export const runtime = 'nodejs';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

function resolveUploadPath(filePath: string): string | null {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) return null;
  return resolved;
}

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

    const absPath = resolveUploadPath(dataset.filePath);
    if (!absPath) {
      return NextResponse.json({ error: 'Invalid dataset file path' }, { status: 400 });
    }

    const content = await readFile(absPath, 'utf-8');
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
