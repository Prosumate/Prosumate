import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prosumate — Enterprise Multi-Tenant SaaS Platform',
  description:
    'Modern Sales, Marketing, and Operations operating system for agencies and high-growth businesses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen antialiased selection:bg-primary-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
