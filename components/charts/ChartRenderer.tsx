'use client';

import {
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import MetricCard from './MetricCard';
import type { ChartWithData, DataPoint } from '@/types/dashboard';

// Per-type default palettes
const PALETTES: Record<string, string[]> = {
  bar:    ['#10b981', '#059669', '#34d399', '#6ee7b7'],
  line:   ['#6366f1', '#818cf8', '#a5b4fc'],
  area:   ['#06b6d4', '#22d3ee', '#67e8f9'],
  pie:    ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'],
  metric: ['#10b981'],
};

const CURRENCY_KEYWORDS = ['revenue', 'cost', 'profit', 'price', 'sales', 'income', 'amount', 'earning'];

function getCurrencyPrefix(title: string, yAxis?: string): string {
  const haystack = `${title} ${yAxis ?? ''}`.toLowerCase();
  return CURRENCY_KEYWORDS.some(k => haystack.includes(k)) ? '₦' : '';
}

function tickFmt(value: unknown): string {
  if (typeof value === 'number') {
    if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(value);
  }
  const s = String(value ?? '');
  return s.length > 14 ? s.slice(0, 12) + '…' : s;
}

const TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: 8,
  fontSize: 12,
  color: '#fafafa',
};

interface Props { chart: ChartWithData }

export default function ChartRenderer({ chart }: Props) {
  const palette = chart.config.colors?.length
    ? chart.config.colors
    : (PALETTES[chart.type] ?? PALETTES.bar);

  const data: DataPoint[] = chart.data ?? [];

  if (chart.type === 'metric') {
    const prefix = getCurrencyPrefix(chart.title, chart.config.yAxis);
    return <MetricCard title={chart.title} value={chart.metricValue ?? 0} prefix={prefix} />;
  }

  const card = (body: React.ReactNode) => (
    <div className="h-full flex flex-col bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="px-4 pt-3.5 pb-1 flex items-center justify-between flex-shrink-0">
        <h3 className="text-sm font-semibold text-zinc-200 truncate">{chart.title}</h3>
      </div>
      <div className="flex-1 min-h-0 px-1 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          {body as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );

  switch (chart.type) {
    case 'bar':
      return card(
        <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={tickFmt} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={tickFmt} width={44} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [tickFmt(v), chart.config.yAxis ?? 'value']}
            cursor={{ fill: '#27272a' }}
          />
          <Bar dataKey="value" fill={palette[0]} radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      );

    case 'line':
      return card(
        <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={`fill-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette[0]} stopOpacity={0.15} />
              <stop offset="100%" stopColor={palette[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={tickFmt} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={tickFmt} width={44} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [tickFmt(v), chart.config.yAxis ?? 'value']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={palette[0]}
            strokeWidth={2}
            fill={`url(#fill-${chart.id})`}
            dot={false}
            activeDot={{ r: 4, fill: palette[0] }}
          />
        </AreaChart>
      );

    case 'area':
      return card(
        <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={`area-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette[0]} stopOpacity={0.25} />
              <stop offset="100%" stopColor={palette[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={tickFmt} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickFormatter={tickFmt} width={44} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [tickFmt(v), chart.config.yAxis ?? 'value']} />
          <Area type="monotone" dataKey="value" stroke={palette[0]} strokeWidth={2} fill={`url(#area-${chart.id})`} dot={false} />
        </AreaChart>
      );

    case 'pie':
      return card(
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius="68%"
            label={({ name, percent }) =>
              `${String(name).slice(0, 15)} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            labelLine={{ stroke: '#52525b', strokeWidth: 1 }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i % palette.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [tickFmt(v), 'value']} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: '#a1a1aa', fontSize: 11 }}>{value}</span>}
          />
        </PieChart>
      );

    default:
      return (
        <div className="h-full flex items-center justify-center bg-zinc-900 rounded-xl border border-zinc-800">
          <p className="text-sm text-zinc-500">Chart type &ldquo;{chart.type}&rdquo; not supported yet</p>
        </div>
      );
  }
}
