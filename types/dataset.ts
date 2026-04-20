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

export interface Dataset {
  id: string;
  name: string;
  source: 'csv' | 'postgres' | 'mysql';
  filePath?: string | null;
  columns: ColumnMeta[];
  rowCount: number;
  userId?: string | null;
  createdAt: string;
}
