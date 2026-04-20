import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
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

    return NextResponse.json({ dataset });
  } catch (err) {
    console.error('[GET /api/datasets/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch dataset' }, { status: 500 });
  }
}

export async function DELETE(
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

    if (dataset.filePath) {
      const absPath = resolveUploadPath(dataset.filePath);
      if (absPath) await unlink(absPath).catch(() => null);
    }

    await prisma.dataset.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/datasets/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 });
  }
}
