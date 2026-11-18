'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Table,
  Layers,
  LogOut,
  Building2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

interface SidebarProps {
  profile: Profile | null;
  activePeriode?: string;
  onCloseMobile?: () => void;
}

export function Sidebar({ profile, activePeriode = '2026-Q2', onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN_UPT', 'ADMIN_PUSAT', 'SUPER_ADMIN', 'PIMPINAN'],
    },
    {
      label: 'Input Data IKA',
      href: `/input/${activePeriode}`,
      icon: FileSpreadsheet,
      roles: ['ADMIN_UPT'],
    },
    {
      label: 'Input Data Pusat',
      href: `/input/${activePeriode}`,
      icon: FileSpreadsheet,
      roles: ['ADMIN_PUSAT', 'SUPER_ADMIN'],
    },
    {
      label: 'Laporan & Approval',
      href: '/laporan',
      icon: Table,
      roles: ['ADMIN_UPT', 'ADMIN_PUSAT', 'SUPER_ADMIN', 'PIMPINAN'],
    },
    {
      label: 'Pohon Indikator',
      href: '/indicators',
      icon: Layers,
      roles: ['SUPER_ADMIN', 'ADMIN_PUSAT', 'PIMPINAN', 'ADMIN_UPT'],
    },
  ];

  const filteredMenuItems = profile
    ? menuItems.filter((item) => item.roles.includes(profile.role))
    : menuItems;

  return (
    <aside className="w-64 h-full flex flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Top Header / Branding */}
      <div>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 dark:border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-indigo-500/20">
            IKA
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              PPSDMPU
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Sistem Kinerja Antara
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
        {/* User Card */}
        {profile && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                {profile.role === 'SUPER_ADMIN' || profile.role === 'ADMIN_PUSAT' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : profile.role === 'ADMIN_UPT' ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {profile.nama}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {profile.role === 'ADMIN_UPT' && profile.upt?.nama
                    ? profile.upt.kode
                    : profile.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Keluar dari Aplikasi"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
