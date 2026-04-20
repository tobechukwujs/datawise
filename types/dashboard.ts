export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'table' | 'metric';
export type Aggregation = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
export type DateGrouping = 'day' | 'week' | 'month' | 'year';
export type SortOrder = 'asc' | 'desc';

export interface ChartConfig {
  xAxis: string;
  yAxis?: string;
  aggregation: Aggregation;
  groupBy?: string | null;
  sortBy?: string | null;
  sortOrder?: SortOrder;
  limit?: number | null;
  colors?: string[];
  dateGrouping?: DateGrouping | null;
  valueColumn?: string; // for metric type
}

export interface ChartPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AIChart {
  type: ChartType;
  title: string;
  config: ChartConfig;
  position: ChartPosition;
}

export interface DashboardAIResponse {
  title: string;
  description: string;
  charts: AIChart[];
}

export interface DataPoint {
  [key: string]: string | number;
}

export interface ChartWithData {
  id: string;
  type: ChartType;
  title: string;
  config: ChartConfig;
  position: ChartPosition;
  data: DataPoint[];
  metricValue?: number;
}

export interface DashboardWithCharts {
  id: string;
  title: string;
  description: string | null;
  prompt: string;
  theme: string;
  isPublic: boolean;
  shareSlug: string | null;
  datasetId: string;
  createdAt: Date;
  updatedAt: Date;
  charts: ChartWithData[];
}
