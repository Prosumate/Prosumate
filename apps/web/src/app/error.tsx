'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold text-red-500">500</h1>
      <h2 className="mt-4 text-2xl font-semibold text-slate-100">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-400">{error.message || 'An unexpected error occurred.'}</p>
      <button
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
