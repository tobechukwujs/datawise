import type { ColumnMeta } from '@/types/dataset';
import type { DashboardAIResponse } from '@/types/dashboard';

/**
 * Returns a hardcoded 4-chart dashboard config (bar, line, pie, metric).
 * Column names are picked from the actual dataset so the data-processor
 * always has valid columns to aggregate — works with any uploaded CSV.
 */
export function mockGenerateDashboard(
  _prompt: string,
  columns: ColumnMeta[]
): DashboardAIResponse {
  const byType = (t: ColumnMeta['type']) => columns.filter(c => c.type === t);

  const numerics   = byType('numeric');
  const dates      = byType('date');
  const cats       = byType('categorical');
  const fallback   = columns[0]?.name ?? 'value';

  // Pick sensible defaults from whatever columns exist
  const xAxisTime  = dates[0]?.name  ?? cats[0]?.name  ?? fallback;
  const xAxisCat   = cats[0]?.name   ?? dates[0]?.name ?? fallback;
  const xAxisCat2  = cats[1]?.name   ?? xAxisCat;
  const yAxis1     = numerics[0]?.name ?? fallback;
  const yAxis2     = numerics[1]?.name ?? yAxis1;

  return {
    title: 'Sales Overview Dashboard',
    description: 'AI-generated dashboard from your uploaded dataset.',
    charts: [
      // ── Metric card ────────────────────────────────────────────
      {
        type: 'metric',
        title: `Total ${yAxis1}`,
        config: {
          xAxis: yAxis1,
          yAxis: yAxis1,
          valueColumn: yAxis1,
          aggregation: 'sum',
          colors: ['#6366f1'],
        },
        position: { x: 0, y: 0, w: 3, h: 2 },
      },
      // ── Second metric card ──────────────────────────────────────
      {
        type: 'metric',
        title: `Avg ${yAxis2}`,
        config: {
          xAxis: yAxis2,
          yAxis: yAxis2,
          valueColumn: yAxis2,
          aggregation: 'avg',
          colors: ['#8b5cf6'],
        },
        position: { x: 3, y: 0, w: 3, h: 2 },
      },
      // ── Bar chart ───────────────────────────────────────────────
      {
        type: 'bar',
        title: `${yAxis1} by ${xAxisCat}`,
        config: {
          xAxis: xAxisCat,
          yAxis: yAxis1,
          aggregation: 'sum',
          sortBy: 'value',
          sortOrder: 'desc',
          limit: 8,
          colors: ['#6366f1', '#8b5cf6', '#3b82f6'],
        },
        position: { x: 0, y: 2, w: 6, h: 4 },
      },
      // ── Line chart ──────────────────────────────────────────────
      {
        type: 'line',
        title: `${yAxis1} over ${xAxisTime}`,
        config: {
          xAxis: xAxisTime,
          yAxis: yAxis1,
          aggregation: 'sum',
          dateGrouping: dates.length > 0 ? 'month' : null,
          colors: ['#06b6d4'],
        },
        position: { x: 6, y: 2, w: 6, h: 4 },
      },
      // ── Pie chart ───────────────────────────────────────────────
      {
        type: 'pie',
        title: `${yAxis2} share by ${xAxisCat2}`,
        config: {
          xAxis: xAxisCat2,
          yAxis: yAxis2,
          aggregation: 'sum',
          limit: 6,
          colors: ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'],
        },
        position: { x: 0, y: 6, w: 6, h: 4 },
      },
    ],
  };
}
