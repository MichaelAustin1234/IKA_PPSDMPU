'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Save, Send, AlertCircle, CheckCircle, Info, Layers, Calendar } from 'lucide-react';
import type { IndikatorNode, PredikatKonversi, Laporan, Periode, Upt } from '@/lib/types';

interface LeafNodeWithIka extends IndikatorNode {
  ikaKode?: string;
  ikaNama?: string;
}

interface InputFormViewProps {
  upt: Upt;
  periode: Periode;
  laporan: Laporan | null;
  leafNodes: LeafNodeWithIka[];
  predikatList: PredikatKonversi[];
  initialValues: Record<string, { nilai_angka: number | null; predikat_id: string | null }>;
  allowedIkas?: string[];
}

const IKA_TABS = [
  { kode: 'IKA.01', label: 'IKA.01: Peningkatan SDM', desc: 'Kelulusan, IPK, Sertifikasi & Penyerapan' },
  { kode: 'IKA.02', label: 'IKA.02: Akreditasi Lembaga & Prodi', desc: 'Akreditasi Institusi & Program Studi' },
  { kode: 'IKA.03', label: 'IKA.03: Kebijakan SDM', desc: 'Penyusunan Pedoman & Regulasi' },
  { kode: 'IKA.04', label: 'IKA.04: Kualitas Layanan Diklat', desc: 'Kepuasan, Tenaga Pendidik & Sarpras' },
  { kode: 'IKA.05', label: 'IKA.05: Profesionalisme ASN', desc: 'Indeks Profesionalitas ASN 9 Satker' },
  { kode: 'IKA.06', label: 'IKA.06: Akuntabilitas Kinerja', desc: 'SAKIP, IKPA, Kearsipan & BLU' },
];

export function InputFormView({
  upt,
  periode,
  laporan,
  leafNodes,
  predikatList,
  initialValues,
  allowedIkas,
}: InputFormViewProps) {
  const router = useRouter();

  // Tab yang diperbolehkan untuk role ini
  const visibleTabs = useMemo(() => {
    if (!allowedIkas || allowedIkas.length === 0) return IKA_TABS;
    return IKA_TABS.filter((tab) => allowedIkas.includes(tab.kode));
  }, [allowedIkas]);

  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeIka, setActiveIka] = useState<string>(
    allowedIkas && allowedIkas.length > 0 ? allowedIkas[0] : 'IKA.01'
  );

  const isReadOnly = laporan?.status === 'SUBMITTED' || laporan?.status === 'APPROVED';

  // Hitung jumlah isian per IKA
  const ikaCounts = useMemo(() => {
    const counts: Record<string, { filled: number; total: number }> = {};
    IKA_TABS.forEach((tab) => {
      counts[tab.kode] = { filled: 0, total: 0 };
    });

    leafNodes.forEach((node) => {
      const ikaKey = node.ikaKode || 'IKA.01';
      if (!counts[ikaKey]) counts[ikaKey] = { filled: 0, total: 0 };
      counts[ikaKey].total += 1;

      const val = values[node.id];
      if (val && (val.nilai_angka !== null || (val.predikat_id !== null && val.predikat_id !== ''))) {
        counts[ikaKey].filled += 1;
      }
    });

    return counts;
  }, [leafNodes, values]);

  // Leaf nodes khusus tab aktif
  const currentLeafNodes = useMemo(() => {
    return leafNodes.filter((n) => (n.ikaKode || 'IKA.01') === activeIka);
  }, [leafNodes, activeIka]);

  const handleInputChange = (nodeId: string, field: 'nilai_angka' | 'predikat_id', val: string) => {
    let parsedNumber: number | null = null;
    if (field === 'nilai_angka') {
      if (val.trim() === '') {
        parsedNumber = null;
      } else {
        // Normalisasi koma menjadi titik untuk desimal lokal Indonesia (misal: "3,85" -> "3.85")
        const normalized = val.replace(',', '.');
        const num = Number(normalized);
        parsedNumber = isNaN(num) ? null : num;
      }
    }

    setValues((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [field]: field === 'nilai_angka' ? parsedNumber : (val === '' ? null : val),
      },
    }));
  };

  const handleSave = async (isSubmit: boolean = false) => {
    setStatusMsg(null);

    // Hitung total terisi di seluruh form
    const totalFilled = Object.values(values).filter(
      (v) => v.nilai_angka !== null || (v.predikat_id !== null && v.predikat_id !== '')
    ).length;

    if (isSubmit && totalFilled === 0) {
      setStatusMsg({
        type: 'error',
        text: 'Mohon isi minimal satu data indikator sebelum mengirimkan (submit) laporan.',
      });
      return;
    }

    if (isSubmit) setSubmitting(true);
    else setSaving(true);

    try {
      const supabase = createClient();

      // 1. Dapatkan atau buat laporan record
      let laporanId = laporan?.id;
      if (!laporanId) {
        const { data: newLap, error: errLap } = await supabase
          .from('laporan')
          .insert({
            upt_id: upt.id,
            periode_id: periode.id,
            status: isSubmit ? 'SUBMITTED' : 'DRAFT',
            submitted_at: isSubmit ? new Date().toISOString() : null,
          })
          .select('id')
          .single();

        if (errLap) throw errLap;
        laporanId = newLap.id;
      } else {
        await supabase
          .from('laporan')
          .update({
            status: isSubmit ? 'SUBMITTED' : 'DRAFT',
            submitted_at: isSubmit ? new Date().toISOString() : null,
          })
          .eq('id', laporanId);
      }

      // 2. Simpan isi leaf node yang terisi ke laporan_isi
      const rowsToUpsert = Object.entries(values)
        .filter(([, v]) => v.nilai_angka !== null || (v.predikat_id !== null && v.predikat_id !== ''))
        .map(([nodeId, v]) => ({
          laporan_id: laporanId,
          node_id: nodeId,
          nilai_angka: v.nilai_angka,
          predikat_id: v.predikat_id,
          sumber: 'MANUAL',
        }));

      if (rowsToUpsert.length > 0) {
        const { error: errIsi } = await supabase
          .from('laporan_isi')
          .upsert(rowsToUpsert, { onConflict: 'laporan_id,node_id' });

        if (errIsi) throw errIsi;
      }

      setStatusMsg({
        type: 'success',
        text: isSubmit
          ? `Laporan berhasil disubmit (${totalFilled} indikator terisi) dan menunggu persetujuan Super Admin!`
          : `Draft formulir berhasil disimpan (${totalFilled} indikator terisi).`,
      });

      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan data';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
              {upt.kode}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {upt.nama}
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mt-1">
            Formulir Pengisian Capaian Kinerja Antara (IKA)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Status Laporan:{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {laporan?.status ?? 'DRAFT'}
            </span>
          </p>
        </div>

        {/* Periode Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Info Periode Sesi Login (Read-Only) */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Tahun {periode.tahun} - Triwulan {periode.triwulan}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
              {periode.status}
            </span>
          </div>

          {/* Action Buttons */}
          {!isReadOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSave(false)}
                disabled={saving || submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Draft'}</span>
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving || submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Mengirim...' : 'Submit Laporan'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {isReadOnly && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Laporan ini berstatus <strong>{laporan?.status}</strong> dan terkunci untuk pengeditan. Hubungi Administrator jika butuh revisi data.
          </span>
        </div>
      )}

      {/* Tabs Navigasi IKA Sesuai Role */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {visibleTabs.map((tab) => {
          const isActive = activeIka === tab.kode;
          const count = ikaCounts[tab.kode] || { filled: 0, total: 0 };
          return (
            <button
              key={tab.kode}
              onClick={() => setActiveIka(tab.kode)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : count.filled > 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {count.filled}/{count.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Input Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {IKA_TABS.find((t) => t.kode === activeIka)?.desc} ({activeIka})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Isi realisasi data mentah triwulanan di bawah ini
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {currentLeafNodes.length} indikator
          </span>
        </div>

        {currentLeafNodes.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Tidak ada indikator input manual untuk kategori ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-36">Kode Node</th>
                  <th className="py-3 px-4">Nama Field Indikator</th>
                  <th className="py-3 px-4 w-32 text-center">Tipe Input</th>
                  <th className="py-3 px-4 w-56 text-right">Nilai Realisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {currentLeafNodes.map((node) => {
                  const nodeVal = values[node.id] || { nilai_angka: null, predikat_id: null };

                  return (
                    <tr key={node.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {node.kode}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{node.nama}</p>
                        {node.catatan && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">
                            {node.catatan}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {node.tipe_input}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {node.tipe_input === 'ANGKA' ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={isReadOnly}
                            value={nodeVal.nilai_angka !== null && nodeVal.nilai_angka !== undefined ? nodeVal.nilai_angka : ''}
                            onChange={(e) =>
                              handleInputChange(node.id, 'nilai_angka', e.target.value)
                            }
                            placeholder={node.max_nilai ? `Maks: ${node.max_nilai}` : '0'}
                            className="w-36 px-3 py-1.5 rounded-lg text-right font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:opacity-50"
                          />
                        ) : node.tipe_input === 'PREDIKAT' ? (
                          <select
                            disabled={isReadOnly}
                            value={nodeVal.predikat_id ?? ''}
                            onChange={(e) =>
                              handleInputChange(node.id, 'predikat_id', e.target.value)
                            }
                            className="w-36 px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:opacity-50"
                          >
                            <option value="">Pilih Predikat</option>
                            {predikatList.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.predikat} (Skor: {p.skor})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-400 italic">Dihitung otomatis</span>
                        )}
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
