import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateDashboard } from '@/lib/anthropic';
import { parseCSV } from '@/lib/csv-parser';
import { processChartData, computeMetric } from '@/lib/data-processor';
import { requireSession } from '@/lib/session';
import type { ColumnMeta } from '@/types/dataset';
import type { AIChart, ChartConfig, ChartWithData, DataPoint } from '@/types/dashboard';

export const runtime = 'nodejs';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const bodySchema = z.object({
  datasetId: z.string().min(1).max(128),
  prompt: z.string().min(1).max(2000),
});

function resolveUploadPath(filePath: string): string | null {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) return null;
  return resolved;
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireSession();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { datasetId, prompt } = parsed.data;

  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    if (dataset.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!dataset.filePath) {
      return NextResponse.json({ error: 'Dataset has no associated file' }, { status: 400 });
    }

    const aiConfig = await generateDashboard(
      prompt,
      dataset.columns as unknown as ColumnMeta[]
    );

    if (!aiConfig?.charts?.length) {
      return NextResponse.json({ error: 'AI returned an empty dashboard config' }, { status: 500 });
    }

    const absPath = resolveUploadPath(dataset.filePath);
    if (!absPath) {
      return NextResponse.json({ error: 'Invalid dataset file path' }, { status: 400 });
    }

    const csvContent = await readFile(absPath, 'utf-8');
    const { rows } = parseCSV(csvContent);

    const chartsWithData: (AIChart & { data: DataPoint[]; metricValue?: number })[] =
      aiConfig.charts.map(chart => {
        const cfg = chart.config as ChartConfig;

        if (chart.type === 'metric') {
          const col = cfg.valueColumn ?? cfg.yAxis ?? cfg.xAxis;
          const agg = cfg.aggregation === 'none' ? 'sum' : cfg.aggregation;
          return { ...chart, data: [], metricValue: computeMetric(rows, col, agg) };
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

        return { ...chart, data };
      });

    const dashboard = await prisma.dashboard.create({
      data: {
        title: aiConfig.title,
        description: aiConfig.description,
        prompt,
        config: aiConfig as object,
        datasetId,
        userId,
        charts: {
          create: chartsWithData.map(c => ({
            type: c.type,
            title: c.title,
            config: c.config as object,
            position: c.position as object,
          })),
        },
      },
      include: { charts: true },
    });

    const finalCharts: ChartWithData[] = dashboard.charts.map((dbChart, i) => ({
      id: dbChart.id,
      type: chartsWithData[i].type,
      title: dbChart.title,
      config: dbChart.config as unknown as ChartConfig,
      position: dbChart.position as unknown as ChartWithData['position'],
      data: chartsWithData[i].data,
      metricValue: chartsWithData[i].metricValue,
    }));

    return NextResponse.json({
      dashboard: {
        id: dashboard.id,
        title: dashboard.title,
        description: dashboard.description,
        prompt: dashboard.prompt,
        theme: dashboard.theme,
        isPublic: dashboard.isPublic,
        datasetId: dashboard.datasetId,
        createdAt: dashboard.createdAt,
      },
      charts: finalCharts,
    });
  } catch (err) {
    console.error('[POST /api/dashboards/generate]', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
