'use client';

import { useState } from 'react';
import {
  History,
  Search,
  Filter,
  FileCheck2,
  CalendarClock,
  KeyRound,
  ShieldAlert,
  User,
  ArrowUpDown,
} from 'lucide-react';
import type { AuditLog, UserRole } from '@/lib/types';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export function AuditLogView({ logs }: AuditLogViewProps) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const matchSearch =
      log.user_nama.toLowerCase().includes(q) ||
      log.user_email.toLowerCase().includes(q) ||
      log.keterangan.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q);

    let matchAction = true;
    if (filterAction === 'LAPORAN') {
      matchAction =
        log.action.includes('LAPORAN') || log.action === 'SUBMIT_LAPORAN';
    } else if (filterAction === 'PERIODE') {
      matchAction = log.action.includes('PERIODE');
    } else if (filterAction === 'PASSWORD') {
      matchAction = log.action.includes('PASSWORD');
    }

    return matchSearch && matchAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'SUBMIT_LAPORAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
            Submit Laporan
          </span>
        );
      case 'APPROVE_LAPORAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
            Setujui Laporan
          </span>
        );
      case 'REJECT_LAPORAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60">
            Tolak Laporan
          </span>
        );
      case 'BUKA_PERIODE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60">
            Buka Periode
          </span>
        );
      case 'TUTUP_PERIODE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
            Tutup Periode
          </span>
        );
      case 'CREATE_PERIODE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
            Tambah Periode
          </span>
        );
      case 'RESET_PASSWORD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60">
            Reset Sandi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {action}
          </span>
        );
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            Super Admin
          </span>
        );
      case 'ADMIN_PUSAT':
        return (
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            Admin Pusat
          </span>
        );
      case 'ADMIN_UPT':
        return (
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            Admin UPT
          </span>
        );
      default:
        return (
          <span className="font-semibold text-slate-500">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Audit Trail & Rekam Jejak Aktivitas
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Catatan log otomatis seluruh peristiwa penting, pelaporan kinerja, verifikasi, dan kontrol sistem
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari user, aksi, deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Kategori Aksi</option>
              <option value="LAPORAN">Laporan & Verifikasi</option>
              <option value="PERIODE">Kontrol Masa Periode</option>
              <option value="PASSWORD">Keamanan Akun & Sandi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">Total Aktivitas</span>
            <History className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {logs.length}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">Pelaporan & Verifikasi</span>
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {logs.filter((l) => l.action.includes('LAPORAN')).length}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">Perubahan Periode</span>
            <CalendarClock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {logs.filter((l) => l.action.includes('PERIODE')).length}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">Keamanan Sandi</span>
            <KeyRound className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {logs.filter((l) => l.action.includes('PASSWORD')).length}
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Daftar Log Riwayat ({filteredLogs.length})
          </h2>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            Belum ada catatan aktivitas yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Waktu & Tanggal</th>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Tindakan / Aksi</th>
                  <th className="py-3 px-4">Keterangan / Detail Peristiwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLogs.map((log) => {
                  const date = new Date(log.created_at);
                  const dateFormatted = date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeFormatted = date.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {dateFormatted}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {timeFormatted} WIB
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{log.user_nama}</span>
                        </div>
                        <div className="text-[10.5px] font-mono text-slate-400 pl-5">
                          {log.user_email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        {getRoleBadge(log.role)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {log.keterangan}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
