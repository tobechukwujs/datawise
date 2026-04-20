import Papa from 'papaparse';

export type ColumnType = 'numeric' | 'date' | 'categorical' | 'text';

export interface ColumnMeta {
  name: string;
  type: ColumnType;
  uniqueCount: number;
  sample: string[];
  stats: {
    min?: number;
    max?: number;
    mean?: number;
  } | null;
}

export interface ParsedCSV {
  columns: ColumnMeta[];
  rows: Record<string, string>[];
  rowCount: number;
}

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,           // 2024-01-15
  /^\d{2}\/\d{2}\/\d{4}$/,         // 01/15/2024
  /^\d{2}-\d{2}-\d{4}$/,           // 01-15-2024
  /^\d{4}\/\d{2}\/\d{2}$/,         // 2024/01/15
  /^\w+ \d{1,2}, \d{4}$/,          // January 15, 2024
  /^\d{1,2} \w+ \d{4}$/,           // 15 January 2024
  /^\d{4}-\d{2}$/,                  // 2024-01
  /^Q[1-4] \d{4}$/,                 // Q1 2024
];

function isDate(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (DATE_PATTERNS.some(p => p.test(trimmed))) return true;
  const parsed = Date.parse(trimmed);
  return !isNaN(parsed) && trimmed.length > 6;
}

function isNumeric(value: string): boolean {
  if (!value) return false;
  const cleaned = value.replace(/[$,%\s]/g, '');
  return !isNaN(Number(cleaned)) && cleaned.length > 0;
}

export function inferType(values: string[]): ColumnType {
  const nonEmpty = values.filter(v => v !== null && v !== undefined && v.trim() !== '');
  if (nonEmpty.length === 0) return 'text';

  const sample = nonEmpty.slice(0, 50);

  const numericCount = sample.filter(isNumeric).length;
  if (numericCount / sample.length >= 0.8) return 'numeric';

  const dateCount = sample.filter(isDate).length;
  if (dateCount / sample.length >= 0.7) return 'date';

  const uniqueRatio = new Set(nonEmpty).size / nonEmpty.length;
  if (uniqueRatio < 0.5 || new Set(nonEmpty).size <= 20) return 'categorical';

  return 'text';
}

function average(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function analyzeColumns(rows: Record<string, string>[]): ColumnMeta[] {
  if (rows.length === 0) return [];

  const columnNames = Object.keys(rows[0]);

  return columnNames.map(col => {
    const values = rows.map(r => r[col]).filter(v => v !== null && v !== undefined);
    const type = inferType(values);
    const uniqueCount = new Set(values).size;

    let stats: ColumnMeta['stats'] = null;
    if (type === 'numeric') {
      const nums = values
        .map(v => parseFloat(v.replace(/[$,%\s]/g, '')))
        .filter(n => !isNaN(n));
      if (nums.length > 0) {
        stats = {
          min: Math.min(...nums),
          max: Math.max(...nums),
          mean: average(nums),
        };
      }
    }

    return {
      name: col,
      type,
      uniqueCount,
      sample: values.slice(0, 5),
      stats,
    };
  });
}

export function parseCSV(fileContent: string): ParsedCSV {
  const result = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
    transform: (v: string) => v.trim(),
  });

  const rows = result.data;
  const columns = analyzeColumns(rows);

  return {
    columns,
    rows,
    rowCount: rows.length,
  };
}
