import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold text-primary-500">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-slate-100">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-400">The requested resource could not be located.</p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
