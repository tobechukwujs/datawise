import FileUpload from '@/components/ui/FileUpload';
import Navbar from '@/components/ui/Navbar';
import PageTransition from '@/components/ui/PageTransition';

export const metadata = {
  title: 'Upload CSV — DashWise',
};

export default function UploadPage() {
  return (
    <>
      <Navbar />
      <PageTransition>
        <main className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-zinc-50">Upload your data</h1>
              <p className="mt-1.5 text-sm text-zinc-400">
                Drop a CSV and we&apos;ll detect column types automatically.
              </p>
            </div>

            <FileUpload />
          </div>
        </main>
      </PageTransition>
    </>
  );
}
