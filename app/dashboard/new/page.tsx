'use client';

import { useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/ui/Navbar';

const EXAMPLE_PROMPTS = [
  'Monthly revenue trend + revenue by region + total revenue KPI',
  'Top 10 products by sales, pie chart of category share, avg order value',
  'Conversions by channel, monthly spend trend, ROAS KPI card',
];

function NewDashboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const datasetId = searchParams.get('datasetId') ?? '';

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function handleGenerate() {
    if (!datasetId) {
      setError('No dataset selected. Please upload a CSV first.');
      return;
    }
    if (!prompt.trim()) {
      setError('Describe the dashboard you want.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/dashboards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId, prompt: prompt.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');

      router.push(`/dashboard/${data.dashboard.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  }

  return (
    <motion.main
      className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center px-6 py-16"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="w-full max-w-xl">
        <div className="mb-7">
          <a
            href="/upload"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Upload different file
          </a>
          <h1 className="text-xl font-bold text-zinc-50">Describe your dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Tell the AI what charts you want. Be specific about chart types and columns.
          </p>
        </div>

        <div className={`rounded-xl border transition-colors ${
          isGenerating ? 'border-zinc-700 opacity-70' : 'border-zinc-700 focus-within:border-zinc-500'
        } bg-zinc-900`}>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => { setPrompt(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Monthly revenue line chart, revenue by region bar chart, and total revenue KPI"
            rows={3}
            disabled={isGenerating}
            className="w-full px-4 pt-4 pb-2 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none leading-relaxed"
            style={{ minHeight: '80px', maxHeight: '200px' }}
          />
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <p className="text-xs text-zinc-600">⌘ + Enter to generate</p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {isGenerating ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2.5 text-xs text-red-400 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        <div className="mt-6">
          <p className="text-xs text-zinc-600 mb-2.5">Try an example</p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setPrompt(ex);
                  setTimeout(autoResize, 0);
                }}
                disabled={isGenerating}
                className="text-left text-xs px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-40"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.main>
  );
}

export default function NewDashboardPage() {
  return (
    <>
      <Navbar />
      <Suspense>
        <NewDashboardForm />
      </Suspense>
    </>
  );
}
