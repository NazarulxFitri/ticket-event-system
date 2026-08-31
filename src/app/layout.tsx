import type { Metadata } from 'next';
import Link from 'next/link';
import { Ticket, QrCode, LayoutDashboard, Sparkles, Calendar } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Multi-Event Wristband & Ticketing Portal',
  description: 'Multi-event booking, multi-ticket per-attendee QR digital passes, staff wristband redemption scanner, and admin dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
        <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <Ticket className="w-5.5 h-5.5" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-1.5">
                  EVENTIX <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">MULTI-EVENT</span>
                </span>
                <p className="text-xs text-slate-400 font-medium">Wristband & Pass Portal</p>
              </div>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Events</span>
              </Link>

              <Link
                href="/scanner"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-sm"
              >
                <QrCode className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Staff Scanner</span>
              </Link>

              <Link
                href="/admin"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Admin Hub</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">{children}</main>

        <footer className="glass-card border-t border-slate-800/80 py-6 px-4 mt-12 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Multi-Event Ticketing & Wristband Engine
            </p>
            <p>Powered by Next.js, Prisma, SQLite & HTML5 QR Scanner</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
