export type Aggregation = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
export type SortOrder = 'asc' | 'desc';

export interface ChartDataConfig {
  xAxis: string;
  yAxis?: string;
  aggregation: Aggregation;
  groupBy?: string | null;
  sortBy?: string | null;
  sortOrder?: SortOrder;
  limit?: number | null;
  dateGrouping?: 'day' | 'week' | 'month' | 'year' | null;
}

export interface DataPoint {
  [key: string]: string | number;
}

function toNumber(v: string | undefined): number {
  if (v === undefined || v === null) return 0;
  const cleaned = String(v).replace(/[$,%\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function truncateDate(raw: string, grouping: 'day' | 'week' | 'month' | 'year'): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  switch (grouping) {
    case 'year':  return String(d.getFullYear());
    case 'month': return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    case 'week': {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    }
    case 'day':
    default:      return raw.slice(0, 10);
  }
}

function groupRowsBy(
  rows: Record<string, string>[],
  key: string,
  dateGrouping?: 'day' | 'week' | 'month' | 'year' | null
): Map<string, Record<string, string>[]> {
  const groups = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const raw = row[key] ?? 'Unknown';
    const k = dateGrouping ? truncateDate(raw, dateGrouping) : raw;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(row);
  }
  return groups;
}

function applyAggregation(
  groups: Map<string, Record<string, string>[]>,
  yAxis: string,
  aggregation: Aggregation
): DataPoint[] {
  const result: DataPoint[] = [];

  groups.forEach((rows, key) => {
    const nums = rows.map((r: Record<string, string>) => toNumber(r[yAxis]));
    let value: number;

    switch (aggregation) {
      case 'sum':
        value = nums.reduce((a: number, b: number) => a + b, 0);
        break;
      case 'avg':
        value = nums.reduce((a: number, b: number) => a + b, 0) / nums.length;
        break;
      case 'count':
        value = rows.length;
        break;
      case 'min':
        value = Math.min(...nums);
        break;
      case 'max':
        value = Math.max(...nums);
        break;
      case 'none':
      default:
        value = toNumber(rows[0]?.[yAxis]);
        break;
    }

    result.push({ name: key, value: parseFloat(value.toFixed(2)) });
  });

  return result;
}

function sortData(
  data: DataPoint[],
  sortBy: string,
  sortOrder: SortOrder
): DataPoint[] {
  return [...data].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    const an = typeof av === 'number' ? av : parseFloat(String(av));
    const bn = typeof bv === 'number' ? bv : parseFloat(String(bv));

    if (!isNaN(an) && !isNaN(bn)) {
      return sortOrder === 'asc' ? an - bn : bn - an;
    }
    const as = String(av ?? '');
    const bs = String(bv ?? '');
    return sortOrder === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
  });
}

export function processChartData(
  config: ChartDataConfig,
  rows: Record<string, string>[]
): DataPoint[] {
  const { xAxis, yAxis, aggregation, sortBy, sortOrder = 'desc', limit, dateGrouping } = config;

  if (!yAxis || aggregation === 'none') {
    const data = rows.map(row => {
      const point: DataPoint = {};
      Object.keys(row).forEach(k => {
        const v = parseFloat(row[k]);
        point[k] = isNaN(v) ? row[k] : v;
      });
      return point;
    });
    const sorted = sortBy ? sortData(data, sortBy, sortOrder) : data;
    return limit ? sorted.slice(0, limit) : sorted;
  }

  const groups = groupRowsBy(rows, xAxis, dateGrouping);
  const aggregated = applyAggregation(groups, yAxis, aggregation);
  // Date-grouped charts default to chronological (asc by key); others default to value desc
  const defaultSortBy = dateGrouping ? 'name' : 'value';
  const defaultSortOrder: SortOrder = dateGrouping ? 'asc' : sortOrder;
  const sorted = sortData(aggregated, sortBy ?? defaultSortBy, sortBy ? sortOrder : defaultSortOrder);
  return limit ? sorted.slice(0, limit) : sorted;
}

export function computeMetric(
  rows: Record<string, string>[],
  column: string,
  aggregation: Aggregation
): number {
  const nums = rows.map(r => toNumber(r[column])).filter(n => !isNaN(n));
  if (nums.length === 0) return 0;

  switch (aggregation) {
    case 'sum': return parseFloat(nums.reduce((a, b) => a + b, 0).toFixed(2));
    case 'avg': return parseFloat((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
    case 'count': return rows.length;
    case 'min': return Math.min(...nums);
    case 'max': return Math.max(...nums);
    default: return nums[0];
  }
}
