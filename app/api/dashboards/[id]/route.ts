import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCSV } from '@/lib/csv-parser';
import { processChartData, computeMetric } from '@/lib/data-processor';
import { requireSession } from '@/lib/session';
import type { ChartConfig, ChartWithData } from '@/types/dashboard';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireSession();
  if (error) return error;

  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: params.id },
      include: {
        charts: { orderBy: { id: 'asc' } },
        dataset: { select: { name: true, filePath: true, rowCount: true } },
      },
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    if (dashboard.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let rows: Record<string, string>[] = [];
    if (dashboard.dataset.filePath) {
      const res = await fetch(dashboard.dataset.filePath).catch(() => null);
      if (res?.ok) {
        const csv = await res.text();
        if (csv) ({ rows } = parseCSV(csv));
      }
    }

    const charts: ChartWithData[] = dashboard.charts.map(dbChart => {
      const cfg = dbChart.config as unknown as ChartConfig;

      if (dbChart.type === 'metric') {
        const col = cfg.valueColumn ?? cfg.yAxis ?? cfg.xAxis;
        const agg = cfg.aggregation === 'none' ? 'sum' : cfg.aggregation;
        return {
          id: dbChart.id,
          type: dbChart.type as ChartWithData['type'],
          title: dbChart.title,
          config: cfg,
          position: dbChart.position as unknown as ChartWithData['position'],
          data: [],
          metricValue: computeMetric(rows, col, agg),
        };
      }

      const data = processChartData(
        {
          xAxis: cfg.xAxis,
          yAxis: cfg.yAxis,
          aggregation: cfg.aggregation,
          groupBy: cfg.groupBy,
          sortBy: cfg.sortBy,
          sortOrder: cfg.sortOrder ?? 'desc',
          limit: cfg.limit,
          dateGrouping: cfg.dateGrouping,
        },
        rows
      );

      return {
        id: dbChart.id,
        type: dbChart.type as ChartWithData['type'],
        title: dbChart.title,
        config: cfg,
        position: dbChart.position as unknown as ChartWithData['position'],
        data,
      };
    });

    return NextResponse.json({
      dashboard: {
        id: dashboard.id,
        title: dashboard.title,
        description: dashboard.description,
        prompt: dashboard.prompt,
        theme: dashboard.theme,
        isPublic: dashboard.isPublic,
        datasetId: dashboard.datasetId,
        dataset: dashboard.dataset,
        createdAt: dashboard.createdAt,
        updatedAt: dashboard.updatedAt,
      },
      charts,
    });
  } catch (err) {
    console.error('[GET /api/dashboards/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireSession();
  if (error) return error;

  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    if (dashboard.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.dashboard.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/dashboards/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete dashboard' }, { status: 500 });
  }
}
