'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, XCircle, Clock, FileText, Check, X, ShieldAlert, Eye, Calendar } from 'lucide-react';
import type { Laporan, Profile, Periode } from '@/lib/types';

interface LaporanListViewProps {
  laporanList: Laporan[];
  periodeList: Periode[];
  currentProfile: Profile;
  activePeriodeKey?: string;
}

interface LaporanIsiDetail {
  id: string;
  nilai_angka: number | null;
  sumber: string;
  node?: {
    kode: string;
    nama: string;
    tipe_input: string;
  };
  predikat?: {
    predikat: string;
    skor: number;
  };
}

export function LaporanListView({
  laporanList,
  periodeList,
  currentProfile,
  activePeriodeKey,
}: LaporanListViewProps) {
  const router = useRouter();

  const currentPeriode =
    periodeList.find(
      (p) => `${p.tahun}-Q${p.triwulan}` === activePeriodeKey
    ) ||
    periodeList.find((p) => p.status === 'BUKA') ||
    periodeList[0];

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal Review State
  const [reviewModalLaporan, setReviewModalLaporan] = useState<Laporan | null>(null);
  const [reviewItems, setReviewItems] = useState<LaporanIsiDetail[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);

  const isSuperAdmin = currentProfile.role === 'SUPER_ADMIN';

  const handleReview = async (laporanId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(laporanId);
    try {
      const supabase = createClient();
      await supabase
        .from('laporan')
        .update({
          status,
          reviewed_by: currentProfile.id,
        })
        .eq('id', laporanId);

      if (reviewModalLaporan?.id === laporanId) {
        setReviewModalLaporan(null);
      }
      router.refresh();
    } catch (err) {
      console.error('Gagal memperbarui status laporan:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const openReviewModal = async (lap: Laporan) => {
    setReviewModalLaporan(lap);
    setLoadingItems(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('laporan_isi')
        .select('*, node:node_id(*), predikat:predikat_id(*)')
        .eq('laporan_id', lap.id);

      setReviewItems((data as LaporanIsiDetail[]) || []);
    } catch (err) {
      console.error('Gagal mengambil rincian laporan:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const filteredLaporan = laporanList.filter((l) =>
    currentPeriode ? l.periode_id === currentPeriode.id : true
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60">
            <Clock className="w-3.5 h-3.5" /> Menunggu Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Laporan Kinerja Antara & Persetujuan
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar pengiriman laporan triwulan dari 8 UPT di bawah binaan PPSDMPU
          </p>
        </div>

        {/* Info Periode Sesi Login (Read-Only) */}
        {currentPeriode && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
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

      {/* Table Laporan */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Status Pengiriman Laporan UPT
        </h2>

        {filteredLaporan.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            Belum ada laporan yang disubmit pada periode ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Kode UPT</th>
                  <th className="py-3 px-4">Nama Satuan Kerja (UPT)</th>
                  <th className="py-3 px-4">Waktu Submit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Rincian Data</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-right">Aksi Persetujuan</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLaporan.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {l.upt?.kode}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {l.upt?.nama}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {l.submitted_at
                        ? new Date(l.submitted_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(l.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openReviewModal(l)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Review Data</span>
                      </button>
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        {l.status === 'SUBMITTED' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReview(l.id, 'APPROVED')}
                              disabled={actionLoading === l.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="Setujui Laporan"
                            >
                              <Check className="w-3 h-3" />
                              <span>Setujui</span>
                            </button>
                            <button
                              onClick={() => handleReview(l.id, 'REJECTED')}
                              disabled={actionLoading === l.id}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                              title="Tolak Laporan"
                            >
                              <X className="w-3 h-3" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Selesai diproses</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Review Rincian Laporan */}
      {reviewModalLaporan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Rincian Data: {reviewModalLaporan.upt?.nama}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Status: <strong className="text-indigo-600 dark:text-indigo-400">{reviewModalLaporan.status}</strong>
                </p>
              </div>
              <button
                onClick={() => setReviewModalLaporan(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1">
              {loadingItems ? (
                <div className="py-8 text-center text-xs text-slate-400">Memuat rincian data...</div>
              ) : reviewItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada isian data nilai untuk laporan ini (Draft kosong saat disubmit).
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-y border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Kode</th>
                        <th className="py-2.5 px-3">Nama Indikator</th>
                        <th className="py-2.5 px-3 text-right">Nilai / Predikat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reviewItems.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {item.node?.kode}
                          </td>
                          <td className="py-2.5 px-3">{item.node?.nama}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">
                            {item.predikat
                              ? `${item.predikat.predikat} (Skor: ${item.predikat.skor})`
                              : item.nilai_angka !== null
                              ? item.nilai_angka
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setReviewModalLaporan(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
              {isSuperAdmin && reviewModalLaporan.status === 'SUBMITTED' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReview(reviewModalLaporan.id, 'REJECTED')}
                    disabled={actionLoading === reviewModalLaporan.id}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Tolak
                  </button>
                  <button
                    onClick={() => handleReview(reviewModalLaporan.id, 'APPROVED')}
                    disabled={actionLoading === reviewModalLaporan.id}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Setujui Laporan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
