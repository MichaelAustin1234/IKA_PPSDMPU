'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { togglePeriodeStatusAction, createPeriodeAction } from '@/app/actions/admin';
import {
  CalendarClock,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
} from 'lucide-react';
import type { Periode } from '@/lib/types';

interface PeriodeManagerViewProps {
  periodes: Periode[];
}

export function PeriodeManagerView({ periodes }: PeriodeManagerViewProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTahun, setNewTahun] = useState<number>(new Date().getFullYear());
  const [newTriwulan, setNewTriwulan] = useState<number>(1);
  const [newStatus, setNewStatus] = useState<'BUKA' | 'TUTUP'>('TUTUP');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggleStatus = async (periode: Periode) => {
    const nextStatus = periode.status === 'BUKA' ? 'TUTUP' : 'BUKA';
    setLoadingId(periode.id);
    setMessage(null);

    const res = await togglePeriodeStatusAction(periode.id, nextStatus);
    setLoadingId(null);

    if (res.success) {
      setMessage({
        type: 'success',
        text: `Status Tahun ${periode.tahun} TW ${periode.triwulan} berhasil diubah menjadi ${nextStatus}.`,
      });
      router.refresh();
    } else {
      setMessage({
        type: 'error',
        text: res.error || 'Gagal mengubah status periode.',
      });
    }
  };

  const handleCreatePeriode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const res = await createPeriodeAction(newTahun, newTriwulan, newStatus);
    setIsSubmitting(false);

    if (res.success) {
      setMessage({
        type: 'success',
        text: `Periode Tahun ${newTahun} TW ${newTriwulan} berhasil ditambahkan!`,
      });
      setIsModalOpen(false);
      router.refresh();
    } else {
      setMessage({
        type: 'error',
        text: res.error || 'Gagal menambahkan periode.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Pengaturan Periode & Triwulan Pelaporan
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kontrol pembukaan dan penutupan masa pengisian laporan IKA per triwulan
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Periode Baru</span>
        </button>
      </div>

      {/* Global alert feedback */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Daftar Periode Triwulan
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Tahun</th>
                <th className="py-3 px-4">Triwulan</th>
                <th className="py-3 px-4">Kode Periode</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi Buka / Tutup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {periodes.map((p) => {
                const isOpen = p.status === 'BUKA';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {p.tahun}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      Triwulan {p.triwulan} (TW {p.triwulan})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      {p.tahun}-Q{p.triwulan}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isOpen ? (
                          <>
                            <Unlock className="w-3 h-3" /> BUKA
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> TUTUP
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        disabled={loadingId === p.id}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                          isOpen
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300'
                        }`}
                      >
                        {isOpen ? (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Tutup Pengisian</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Buka Pengisian</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Periode */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tambah Periode Triwulan Baru
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tambahkan tahun atau triwulan pelaporan baru
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriode} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tahun Anggaran
                </label>
                <input
                  type="number"
                  min={2020}
                  max={2035}
                  required
                  value={newTahun}
                  onChange={(e) => setNewTahun(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Triwulan
                </label>
                <select
                  value={newTriwulan}
                  onChange={(e) => setNewTriwulan(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value={1}>Triwulan 1 (TW 1)</option>
                  <option value={2}>Triwulan 2 (TW 2)</option>
                  <option value={3}>Triwulan 3 (TW 3)</option>
                  <option value={4}>Triwulan 4 (TW 4)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Pengisian Awal
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'BUKA' | 'TUTUP')}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="TUTUP">TUTUP (Terkunci)</option>
                  <option value="BUKA">BUKA (Dapat diisi UPT)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Tambah Periode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
