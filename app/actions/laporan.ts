'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { hitungSnapshotLaporan, NodeMetadata } from '@/lib/ika/calculations';
import { revalidatePath } from 'next/cache';
import { recordAuditLog } from '@/lib/audit';

export interface SubmitLaporanPayload {
  laporanId?: string;
  uptId: string;
  periodeId: string;
  values: Record<string, { nilai_angka: number | null; predikat_id: string | null }>;
}

export async function submitLaporanAction(payload: SubmitLaporanPayload) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // 1. Verifikasi user yang sedang login
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return { success: false, error: 'Sesi login telah berakhir. Silakan login kembali.' };
    }

    // Ambil profil user
    const { data: profile } = await supabase
      .from('profiles')
      .select('nama, role, upt_id, upt:upt_id(kode, nama)')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'Profil pengguna tidak ditemukan.' };
    }

    if (profile.role === 'PIMPINAN') {
      return { success: false, error: 'Role Pimpinan bersifat read-only dan tidak dapat mengirim laporan.' };
    }

    if (profile.role === 'SUPER_ADMIN') {
      return { success: false, error: 'Role Super Admin bertugas mengelola sistem dan tidak berwenang mengirim laporan kinerja.' };
    }

    // Jika Admin UPT, pastikan hanya submit untuk UPT miliknya sendiri
    if (profile.role === 'ADMIN_UPT' && profile.upt_id !== payload.uptId) {
      return { success: false, error: 'Anda hanya memiliki hak akses untuk UPT Anda sendiri.' };
    }

    // 2. Buat atau perbarui record laporan
    let laporanId = payload.laporanId;
    if (!laporanId) {
      const { data: newLap, error: errLap } = await supabase
        .from('laporan')
        .insert({
          upt_id: payload.uptId,
          periode_id: payload.periodeId,
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (errLap) throw errLap;
      laporanId = newLap.id;
    } else {
      const { error: errUpdate } = await supabase
        .from('laporan')
        .update({
          status: 'SUBMITTED',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', laporanId);

      if (errUpdate) throw errUpdate;
    }

    // 3. Simpan isi leaf node ke laporan_isi
    const rowsToUpsert = Object.entries(payload.values)
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

    // 4. Hitung snapshot pohon secara bottom-up untuk hasil_hitung
    // Menggunakan adminClient agar memiliki akses menyeluruh untuk membaca master node & predikat
    const [{ data: allNodes }, { data: predikats }] = await Promise.all([
      adminClient.from('indikator_node').select('*'),
      adminClient.from('predikat_konversi').select('*'),
    ]);

    const predikatMap: Record<string, number> = {};
    (predikats || []).forEach((p) => {
      predikatMap[p.id] = Number(p.skor);
    });

    const snapshotItems = hitungSnapshotLaporan(
      (allNodes as NodeMetadata[]) || [],
      payload.values,
      predikatMap
    );

    // 5. Tulis snapshot ke tabel hasil_hitung via adminClient (menjamin konsistensi snapshot sistem)
    const snapshotRows = snapshotItems
      .filter((s) => s.skor_normalisasi !== null || s.realisasi !== null)
      .map((s) => ({
        laporan_id: laporanId,
        node_id: s.node_id,
        realisasi: s.realisasi,
        skor_normalisasi: s.skor_normalisasi,
        skor_terbobot: s.skor_terbobot,
        dihitung_pada: new Date().toISOString(),
      }));

    if (snapshotRows.length > 0) {
      const { error: errHasil } = await adminClient
        .from('hasil_hitung')
        .upsert(snapshotRows, { onConflict: 'laporan_id,node_id' });

      if (errHasil) throw errHasil;
    }

    // 5. Catat ke Audit Log
    const uptRaw = profile.upt as unknown;
    const uptObj = Array.isArray(uptRaw) ? uptRaw[0] : uptRaw;
    const uptKode = uptObj && typeof uptObj === 'object' && 'kode' in uptObj ? String((uptObj as { kode: unknown }).kode) : '';
    const uptInfo = uptKode ? `UPT ${uptKode}` : 'Pusat PPSDMPU';
    await recordAuditLog({
      userId: user.id,
      userEmail: user.email || '',
      userNama: profile.nama,
      role: profile.role,
      action: 'SUBMIT_LAPORAN',
      targetType: 'LAPORAN',
      targetId: laporanId,
      keterangan: `${profile.nama} (${uptInfo}) mengirimkan laporan capaian kinerja triwulan`,
      detail: {
        laporanId,
        uptId: payload.uptId,
        periodeId: payload.periodeId,
        calculatedCount: snapshotRows.length,
      },
    });

    revalidatePath('/input');
    revalidatePath('/laporan');
    revalidatePath('/dashboard');
    revalidatePath('/audit-log');

    return {
      success: true,
      laporanId,
      calculatedCount: snapshotRows.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat submit laporan.';
    return { success: false, error: message };
  }
}

/**
 * Memproses verifikasi laporan (Setujui atau Tolak dengan catatan revisi)
 * Mencatat hasil verifikasi ke Audit Trail secara transparan.
 */
export async function reviewLaporanAction(
  laporanId: string,
  status: 'APPROVED' | 'REJECTED',
  catatan?: string
) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return { success: false, error: 'Sesi login telah berakhir.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nama, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'ADMIN_PUSAT' && profile.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Hanya Admin Pusat dan Super Admin yang berwenang memverifikasi laporan.' };
    }

    const { data: lap, error: lapErr } = await adminClient
      .from('laporan')
      .update({
        status,
        reviewed_by: user.id,
        catatan: status === 'REJECTED' ? (catatan?.trim() || 'Perlu perbaikan data.') : null,
      })
      .eq('id', laporanId)
      .select('*, upt:upt_id(*), periode:periode_id(*)')
      .single();

    if (lapErr) throw lapErr;

    const uptKode = lap?.upt?.kode || 'UPT';
    const periodeDesc = lap?.periode ? `Tahun ${lap.periode.tahun} TW ${lap.periode.triwulan}` : '';

    await recordAuditLog({
      userId: user.id,
      userEmail: user.email || '',
      userNama: profile.nama,
      role: profile.role,
      action: status === 'APPROVED' ? 'APPROVE_LAPORAN' : 'REJECT_LAPORAN',
      targetType: 'LAPORAN',
      targetId: laporanId,
      keterangan:
        status === 'APPROVED'
          ? `${profile.nama} menyetujui laporan ${uptKode} (${periodeDesc})`
          : `${profile.nama} menolak laporan ${uptKode} (${periodeDesc}). Catatan: ${catatan?.trim() || 'Perlu perbaikan data'}`,
      detail: {
        laporanId,
        status,
        catatan: catatan?.trim() || null,
        uptKode,
      },
    });

    revalidatePath('/laporan');
    revalidatePath('/audit-log');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memproses verifikasi laporan.';
    return { success: false, error: message };
  }
}

/**
 * Mengambil daftar periode untuk dropdown halaman login (publik/server action)
 * Menggunakan adminClient agar dapat dibaca sebelum pengguna login.
 */
export async function getDaftarPeriodeAction() {
  try {
    const adminClient = createAdminClient();
    const { data: periodes, error } = await adminClient
      .from('periode')
      .select('id, tahun, triwulan, status')
      .order('tahun', { ascending: false })
      .order('triwulan', { ascending: false });

    if (error) throw error;
    return { success: true, data: periodes || [] };
  } catch (err) {
    console.error('Gagal mengambil daftar periode:', err);
    return { success: false, data: [] };
  }
}

