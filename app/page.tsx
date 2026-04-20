import Navbar from '@/components/ui/Navbar';
import PageTransition from '@/components/ui/PageTransition';

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: 'Smart column detection',
    description: 'Automatically classifies dates, numbers, and categories from your CSV headers.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Plain-English prompts',
    description: 'Describe what you want to see in natural language. No SQL, no drag-and-drop.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    title: 'Live chart grid',
    description: 'Bar, line, area, pie charts and KPI cards — laid out automatically in a responsive grid.',
  },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="min-h-[calc(100vh-3rem)] flex flex-col">
          {/* Hero */}
          <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-50 leading-[1.1]">
                Turn your CSV into a<br />
                <span className="text-emerald-400">live dashboard</span>
              </h1>

              <p className="text-lg text-zinc-400 max-w-md mx-auto leading-relaxed">
                Upload a spreadsheet, describe what you want to see, and get charts built automatically.
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <a
                  href="/upload"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Upload CSV
                </a>
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 font-semibold rounded-lg transition-colors text-sm"
                >
                  View dashboards
                </a>
              </div>
            </div>

            {/* Dashboard preview mockup */}
            <div className="mt-16 w-full max-w-4xl mx-auto">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
                {/* Fake browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
                  <span className="w-3 h-3 rounded-full bg-zinc-700" />
                  <span className="w-3 h-3 rounded-full bg-zinc-700" />
                  <span className="w-3 h-3 rounded-full bg-zinc-700" />
                  <div className="ml-3 flex-1 h-5 rounded bg-zinc-800 max-w-[200px]" />
                </div>
                {/* Fake dashboard grid */}
                <div className="p-5 grid grid-cols-12 gap-3">
                  {/* KPI cards */}
                  <div className="col-span-3 h-20 rounded-lg bg-zinc-800 border border-zinc-700 p-3 flex flex-col justify-between">
                    <div className="h-2 w-16 rounded bg-zinc-700" />
                    <div className="h-5 w-20 rounded bg-emerald-500/30" />
                  </div>
                  <div className="col-span-3 h-20 rounded-lg bg-zinc-800 border border-zinc-700 p-3 flex flex-col justify-between">
                    <div className="h-2 w-12 rounded bg-zinc-700" />
                    <div className="h-5 w-16 rounded bg-indigo-500/30" />
                  </div>
                  <div className="col-span-6 h-20 rounded-lg bg-zinc-800 border border-zinc-700 p-3 flex flex-col justify-between">
                    <div className="h-2 w-20 rounded bg-zinc-700" />
                    <div className="flex items-end gap-1 h-10">
                      {[40, 70, 50, 90, 60, 80, 45, 95].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-emerald-500/40" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  {/* Chart area */}
                  <div className="col-span-7 h-32 rounded-lg bg-zinc-800 border border-zinc-700 p-3">
                    <div className="h-2 w-24 rounded bg-zinc-700 mb-3" />
                    <div className="flex items-end gap-1 h-20">
                      {[55, 40, 70, 55, 85, 65, 95, 75, 60, 80, 50, 90].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-indigo-500/30" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="col-span-5 h-32 rounded-lg bg-zinc-800 border border-zinc-700 p-3">
                    <div className="h-2 w-16 rounded bg-zinc-700 mb-3" />
                    <div className="flex items-center justify-center h-20">
                      <div className="w-16 h-16 rounded-full border-4 border-emerald-500/40" style={{ borderLeftColor: '#10b981' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="border-t border-zinc-800 px-6 py-16">
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
              {FEATURES.map(f => (
                <div key={f.title} className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400">
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </PageTransition>
    </>
  );
}
