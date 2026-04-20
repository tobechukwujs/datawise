import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { parseCSV } from '@/lib/csv-parser';
import { requireSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { userId, error } = await requireSession();
  if (error) return error;

  let blobUrl: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are accepted' }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be under 10 MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const content = new TextDecoder().decode(bytes);

    const { columns, rows, rowCount } = parseCSV(content);

    if (rowCount === 0) {
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
    }

    const baseName = file.name.replace(/\.csv$/i, '').replace(/[^a-z0-9_-]/gi, '_');
    const filename = `csvs/${Date.now()}-${baseName}.csv`;

    const blob = await put(filename, content, {
      access: 'public',
      contentType: 'text/csv',
    });
    blobUrl = blob.url;

    const dataset = await prisma.dataset.create({
      data: {
        name: file.name.replace(/\.csv$/i, ''),
        source: 'csv',
        filePath: blob.url,
        columns: columns as object[],
        rowCount,
        userId,
      },
    });

    blobUrl = null; // ownership transferred to DB record

    return NextResponse.json({
      dataset: {
        id: dataset.id,
        name: dataset.name,
        source: dataset.source,
        filePath: dataset.filePath,
        columns: dataset.columns,
        rowCount: dataset.rowCount,
        createdAt: dataset.createdAt,
      },
      preview: rows.slice(0, 5),
    });
  } catch (err) {
    if (blobUrl) await del(blobUrl).catch(() => null);
    console.error('[POST /api/datasets/upload]', err);
    return NextResponse.json({ error: 'Failed to process CSV file' }, { status: 500 });
  }
}
