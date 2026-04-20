'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';
import ChartRenderer from '@/components/charts/ChartRenderer';
import type { ChartWithData, DashboardWithCharts } from '@/types/dashboard';

type DashboardData = Omit<DashboardWithCharts, 'charts'> & {
  dataset?: { name: string };
};

function colSpanClass(w: number): string {
  const map: Record<number, string> = {
    1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3',
    4: 'col-span-4', 5: 'col-span-5', 6: 'col-span-6',
    7: 'col-span-7', 8: 'col-span-8', 9: 'col-span-9',
    10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
  };
  return map[w] ?? 'col-span-6';
}

function rowHeightPx(h: number): number {
  return Math.max(h * 88, 160);
}

function ChartSkeleton() {
  return (
    <div className="h-full rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
  );
}

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [charts, setCharts] = useState<ChartWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboards/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDashboard(data.dashboard);
        setCharts(data.charts);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm('Delete this dashboard?')) return;
    setDeleting(true);
    await fetch(`/api/dashboards/${id}`, { method: 'DELETE' });
    router.push('/dashboard');
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-[calc(100vh-3rem)] px-6 py-6">
          {/* Toolbar skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1.5">
              <div className="h-4 w-48 rounded bg-zinc-800 animate-pulse" />
              <div className="h-3 w-24 rounded bg-zinc-800 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="h-8 w-16 rounded-lg bg-zinc-800 animate-pulse" />
            </div>
          </div>
          {/* Charts skeleton */}
          <div className="grid grid-cols-12 gap-4">
            {[3, 3, 6, 6, 6].map((w, i) => (
              <div key={i} className={colSpanClass(w)} style={{ height: rowHeightPx(i < 2 ? 2 : 4) }}>
                <ChartSkeleton />
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  if (error || !dashboard) {
    return (
      <>
        <Navbar />
        <main className="min-h-[calc(100vh-3rem)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-zinc-400 mb-4">{error ?? 'Dashboard not found'}</p>
            <a href="/dashboard" className="text-sm text-emerald-400 hover:underline">
              Back to dashboards
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <motion.main
        className="min-h-[calc(100vh-3rem)] pb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Toolbar */}
        <div className="sticky top-12 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-0.5">
              <a href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboards</a>
              <span>/</span>
              <span className="text-zinc-400 truncate">{dashboard.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-zinc-50 truncate">{dashboard.title}</h1>
              {dashboard.dataset?.name && (
                <span className="text-xs text-zinc-600 flex-shrink-0">{dashboard.dataset.name}.csv</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={`/dashboard/new?datasetId=${dashboard.datasetId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </a>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-red-800 text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Prompt line */}
        {dashboard.prompt && (
          <div className="px-6 pt-4 pb-0 max-w-screen-2xl mx-auto">
            <p className="text-xs text-zinc-600 italic truncate">
              &ldquo;{dashboard.prompt}&rdquo;
            </p>
          </div>
        )}

        {/* Chart grid */}
        <div className="px-6 pt-5 max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-12 gap-4">
            {charts.map((chart, i) => (
              <motion.div
                key={chart.id}
                className={colSpanClass(chart.position.w)}
                style={{ height: rowHeightPx(chart.position.h) }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05, ease: 'easeOut' }}
              >
                <ChartRenderer chart={chart} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.main>
    </>
  );
}
