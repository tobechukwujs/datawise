import type { ColumnMeta } from '@/types/dataset';

export function buildSystemPrompt(columns: ColumnMeta[]): string {
  // Lean representation — column names, types, and top samples only
  const colSummary = columns.map(c => ({
    name: c.name,
    type: c.type,
    uniqueCount: c.uniqueCount,
    sample: c.sample.slice(0, 3),
    stats: c.stats,
  }));

  return `You are a data visualization expert. Given a dataset's column schema and a user's natural language request, generate a complete dashboard configuration as JSON.

DATASET COLUMNS:
${JSON.stringify(colSummary, null, 2)}

INSTRUCTIONS:
1. Map the user's intent to chart types: bar, line, pie, area, metric
2. Choose the right aggregation for each chart: sum, avg, count, min, max, none
3. For date columns, set dateGrouping: "day" | "week" | "month" | "year" based on the date range inferred from samples
4. Always add 1–3 metric (KPI) cards for key totals or averages at the top of the dashboard
5. Use this color palette: ["#6366f1","#8b5cf6","#3b82f6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899"]
6. Arrange charts in a 12-column grid. Positions are zero-indexed. Make sure x + w <= 12 for charts on the same row.
7. Return ONLY valid JSON — no markdown fences, no prose, no explanation

GRID REFERENCE:
- metric cards:     w:3, h:2  (fit 4 per row at y:0)
- bar / line / area: w:6, h:4  (2 per row) or w:12, h:4 (full width)
- pie:              w:4, h:4  (3 per row) or w:6, h:4
- Increment y for each new row (h of tallest chart in previous row)

RESPONSE SCHEMA (return exactly this shape):
{
  "title": "string",
  "description": "string",
  "charts": [
    {
      "type": "bar|line|pie|area|metric",
      "title": "string",
      "config": {
        "xAxis": "column_name",
        "yAxis": "column_name",
        "aggregation": "sum|avg|count|min|max|none",
        "groupBy": null,
        "sortBy": "column_name or null",
        "sortOrder": "asc|desc",
        "limit": null,
        "colors": ["#6366f1"],
        "dateGrouping": null,
        "valueColumn": "column_name (metric type only — the column to aggregate)"
      },
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
    }
  ]
}`;
}
