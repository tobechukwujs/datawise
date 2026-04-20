'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';

interface DashboardSummary {
  id: string;
  title: string;
  description: string | null;
  prompt: string;
  createdAt: string;
  dataset: { name: string; rowCount: number };
  _count: { charts: number };
}

export default function DashboardListPage() {
  const [dashboards, setDashboards] = useState<DashboardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboards')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDashboards(data.dashboards ?? []);
      })
      .catch(e => setFetchError(e.message ?? 'Failed to load dashboards'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <motion.main
        className="min-h-[calc(100vh-3rem)] px-6 py-10"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-zinc-50">Dashboards</h1>
              {!loading && (
                <p className="text-sm text-zinc-500 mt-0.5">
                  {dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <a
              href="/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </a>
          </div>

          {fetchError ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-red-400 mb-4">{fetchError}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-zinc-500 hover:text-zinc-300 underline"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-zinc-900 border border-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : dashboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500 mb-4">No dashboards yet</p>
              <a
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Upload a CSV to get started
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboards.map((d, i) => (
                <motion.a
                  key={d.id}
                  href={`/dashboard/${d.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.04, ease: 'easeOut' }}
                  className="group block p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-zinc-50 transition-colors line-clamp-2 leading-snug">
                      {d.title}
                    </h2>
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium border border-zinc-700">
                      {d._count.charts}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 line-clamp-2 mb-4 italic leading-relaxed">
                    &ldquo;{d.prompt}&rdquo;
                  </p>

                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span className="truncate">{d.dataset.name} · {d.dataset.rowCount.toLocaleString()} rows</span>
                    <span className="flex-shrink-0 ml-2">{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </motion.main>
    </>
  );
}
