import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { parseCSV } from '@/lib/csv-parser';
import { requireSession } from '@/lib/session';

export const runtime = 'nodejs';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export async function POST(req: NextRequest) {
  const { userId, error } = await requireSession();
  if (error) return error;

  let savedPath: string | null = null;

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

    await mkdir(UPLOADS_DIR, { recursive: true });

    // Sanitize: only allow safe characters, no dots that could traverse paths
    const baseName = file.name.replace(/\.csv$/i, '').replace(/[^a-z0-9_-]/gi, '_');
    const filename = `${Date.now()}-${baseName}.csv`;
    const absolutePath = path.join(UPLOADS_DIR, filename);

    // Confirm resolved path stays within uploads dir
    if (!absolutePath.startsWith(UPLOADS_DIR + path.sep)) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    await writeFile(absolutePath, content, 'utf-8');
    savedPath = absolutePath;

    const relPath = `uploads/${filename}`;
    const dataset = await prisma.dataset.create({
      data: {
        name: file.name.replace(/\.csv$/i, ''),
        source: 'csv',
        filePath: relPath,
        columns: columns as object[],
        rowCount,
        userId,
      },
    });

    savedPath = null; // ownership transferred to DB record

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
    // Clean up file if DB write failed
    if (savedPath) await unlink(savedPath).catch(() => null);
    console.error('[POST /api/datasets/upload]', err);
    return NextResponse.json({ error: 'Failed to process CSV file' }, { status: 500 });
  }
}
