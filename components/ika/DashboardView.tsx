'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Building,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import type { Upt, Periode, Profile } from '@/lib/types';

interface IkaSummaryItem {
  kode: string;
  nama: string;
  skor: number;
  bobot: number;
  skorTerbobot: number;
  status: 'TERCAPAI' | 'MENDEKATI' | 'KRITIS';
}

interface DashboardViewProps {
  uptList: Upt[];
  periodeList: Periode[];
  currentProfile: Profile;
  initialSummary: IkaSummaryItem[];
  activePeriodeKey?: string;
}

export function DashboardView({
  uptList,
  periodeList,
  currentProfile,
  initialSummary,
  activePeriodeKey,
}: DashboardViewProps) {
  const [selectedUpt, setSelectedUpt] = useState<string>(
    currentProfile.role === 'ADMIN_UPT' && currentProfile.upt_id
      ? currentProfile.upt_id
      : 'ALL'
  );

  const currentPeriode =
    periodeList.find(
      (p) => `${p.tahun}-Q${p.triwulan}` === activePeriodeKey
    ) ||
    periodeList.find((p) => p.status === 'BUKA') ||
    periodeList[0];

  const summary = initialSummary;

  // Hitung metrik agregat
  const rataRataCapaian =
    summary.length > 0
      ? Math.round(
          (summary.reduce((acc, item) => acc + item.skor, 0) / summary.length) * 10
        ) / 10
      : 0;

  const totalTercapai = summary.filter((s) => s.status === 'TERCAPAI').length;
  const totalMendekati = summary.filter((s) => s.status === 'MENDEKATI').length;
  const totalKritis = summary.filter((s) => s.status === 'KRITIS').length;

  const chartData = summary.map((s) => ({
    name: s.kode,
    fullName: s.nama,
    skor: s.skor,
    status: s.status,
  }));

  const pieData = [
    { name: 'Tercapai (≥100%)', value: totalTercapai, color: '#10B981' },
    { name: 'Mendekati (80-99%)', value: totalMendekati, color: '#F59E0B' },
    { name: 'Kritis (<80%)', value: totalKritis, color: '#EF4444' },
  ].filter((p) => p.value > 0);

  const getStatusBadge = (status: 'TERCAPAI' | 'MENDEKATI' | 'KRITIS') => {
    switch (status) {
      case 'TERCAPAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tercapai
          </span>
        );
      case 'MENDEKATI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
            <AlertTriangle className="w-3.5 h-3.5" /> Mendekati
          </span>
        );
      case 'KRITIS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
            <AlertOctagon className="w-3.5 h-3.5" /> Kritis
          </span>
        );
    }
  };

  const getBarColor = (status: string) => {
    if (status === 'TERCAPAI') return '#10B981';
    if (status === 'MENDEKATI') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard Capaian Kinerja Antara (IKA)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoring performa 6 Indikator Kinerja Antara PPSDMPU
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* UPT Selector (Only for Super Admin & Pimpinan) */}
          {currentProfile.role !== 'ADMIN_UPT' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedUpt}
                onChange={(e) => setSelectedUpt(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="ALL" className="dark:bg-slate-900">
                  Semua UPT (Agregat Nasional)
                </option>
                {uptList.map((upt) => (
                  <option key={upt.id} value={upt.id} className="dark:bg-slate-900">
                    {upt.kode} - {upt.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Info Periode Sesi Login (Read-Only) */}
          {currentPeriode && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Tahun {currentPeriode.tahun} - Triwulan {currentPeriode.triwulan}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                {currentPeriode.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rata-Rata */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Rata-Rata Capaian</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {rataRataCapaian}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              6 Indikator
            </span>
          </div>
        </div>

        {/* Tercapai */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Tercapai (≥ 100%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {totalTercapai}
            </span>
            <span className="text-xs text-slate-400">Indikator</span>
          </div>
        </div>

        {/* Mendekati */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Mendekati (80 - 99%)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {totalMendekati}
            </span>
            <span className="text-xs text-slate-400">Indikator</span>
          </div>
        </div>

        {/* Kritis */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Kritis (&lt; 80%)</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {totalKritis}
            </span>
            <span className="text-xs text-slate-400">Indikator</span>
          </div>
        </div>
      </div>

      {/* Visualisasi Charts (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horizontal Bar Chart (2 Kolom) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
            Perbandingan Capaian 6 IKA (%)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 120]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip
                  formatter={(val: unknown) => [`${val}%`, 'Skor']}
                  labelFormatter={(name) => {
                    const item = chartData.find((d) => d.name === name);
                    return `${name} - ${item?.fullName || ''}`;
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="skor" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Distribution (1 Kolom) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Distribusi Status Capaian
          </h2>
          <div className="h-56 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">Belum ada data</p>
            )}
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tercapai
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{totalTercapai}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Mendekati
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{totalMendekati}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Kritis
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">{totalKritis}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Rincian 6 IKA */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Tabel Rincian 6 Indikator Kinerja Antara (IKA)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Nama Indikator</th>
                <th className="py-3 px-4 text-center">Bobot</th>
                <th className="py-3 px-4 text-right">Skor Capaian</th>
                <th className="py-3 px-4 text-right">Skor Terbobot</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {summary.map((item) => (
                <tr
                  key={item.kode}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                    {item.kode}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                    {item.nama}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                    {item.bobot}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {item.skor}%
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {item.skorTerbobot}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
