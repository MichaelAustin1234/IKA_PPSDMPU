'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import type { Profile } from '@/lib/types';

interface AppShellProps {
  profile: Profile | null;
  activePeriode?: string;
  children: React.ReactNode;
}

export function AppShell({ profile, activePeriode = '2026-Q2', children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar (hidden on mobile, visible md+) */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar profile={profile} activePeriode={activePeriode} />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sliding Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative h-full flex">
          <Sidebar
            profile={profile}
            activePeriode={activePeriode}
            onCloseMobile={() => setMobileOpen(false)}
          />
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 -right-12 p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Topbar */}
        <header className="hidden md:flex items-center justify-between px-8 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-b border-slate-200/60 dark:border-slate-800/60 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Sesi Pelaporan: Tahun {activePeriode.replace('-Q', ' - Triwulan ')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {profile && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>{profile.nama}</span>
                <span className="px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px]">
                  {profile.role.replace('_', ' ')}
                </span>
              </div>
            )}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <ThemeToggle showLabel />
          </div>
        </header>

        {/* Mobile Topbar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm text-slate-900 dark:text-white">IKA PPSDMPU</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {activePeriode}
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
