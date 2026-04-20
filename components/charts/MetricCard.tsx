'use client';

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
}

function formatValue(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (!Number.isInteger(n)) return n.toFixed(2);
  return n.toLocaleString();
}

export default function MetricCard({ title, value, prefix = '' }: MetricCardProps) {
  return (
    <div className="h-full flex flex-col justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 truncate">
        {title}
      </p>
      <p className="text-3xl font-bold text-zinc-50 mt-2 truncate">
        {prefix}{formatValue(value)}
      </p>
      <div className="mt-3 h-px bg-zinc-800" />
    </div>
  );
}
