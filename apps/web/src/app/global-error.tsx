'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen antialiased flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl font-bold text-red-500">500</h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-100">Fatal Application Error</h2>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
        >
          Reload
        </button>
      </body>
    </html>
  );
}
