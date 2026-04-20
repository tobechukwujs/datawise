'use client';

import { useCallback, useState } from 'react';
import { ColumnMeta } from '@/types/dataset';

interface UploadResult {
  dataset: {
    id: string;
    name: string;
    rowCount: number;
    columns: ColumnMeta[];
    createdAt: string;
  };
  preview: Record<string, string>[];
}

interface FileUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
}

const TYPE_DOT: Record<string, string> = {
  numeric:     'bg-blue-400',
  date:        'bg-emerald-400',
  categorical: 'bg-violet-400',
  text:        'bg-zinc-500',
};

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Only .csv files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/datasets/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      setResult(data);
      onUploadComplete?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  if (result) {
    return <UploadSuccess result={result} onReset={() => setResult(null)} />;
  }

  return (
    <div className="w-full">
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('csv-file-input')?.click()}
        className={`
          relative border border-dashed rounded-xl p-10 text-center transition-all duration-150 cursor-pointer
          ${isDragging
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/40'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onFileInputChange}
        />

        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <>
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-400">Analyzing CSV…</p>
            </>
          ) : (
            <>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isDragging ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {isDragging ? 'Drop it here' : 'Drop CSV here or click to browse'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Up to 10 MB · First row must be headers</p>
              </div>
            </>
          )}
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
    </div>
  );
}

function UploadSuccess({ result, onReset }: { result: UploadResult; onReset: () => void }) {
  const { dataset, preview } = result;
  const columns = dataset.columns as ColumnMeta[];

  return (
    <div className="w-full space-y-5">
      {/* Success banner */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-100">{dataset.name}.csv</p>
            <p className="text-xs text-zinc-500">{dataset.rowCount.toLocaleString()} rows · {columns.length} columns</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Replace
        </button>
      </div>

      {/* Detected columns */}
      <div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2.5">Detected columns</p>
        <div className="flex flex-wrap gap-2">
          {columns.map(col => (
            <div
              key={col.name}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs"
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_DOT[col.type] ?? 'bg-zinc-500'}`} />
              <span className="text-zinc-300 font-medium">{col.name}</span>
              <span className="text-zinc-600">{col.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview table */}
      <div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2.5">Preview</p>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900">
                {columns.map(col => (
                  <th key={col.name} className="px-3 py-2 text-left font-medium text-zinc-500 whitespace-nowrap">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/50'}>
                  {columns.map(col => (
                    <td key={col.name} className="px-3 py-2 text-zinc-400 whitespace-nowrap max-w-[160px] truncate">
                      {row[col.name] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <a
        href={`/dashboard/new?datasetId=${dataset.id}`}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        Generate dashboard with AI
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>
    </div>
  );
}
