'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { hitungSnapshotLaporan, NodeMetadata } from '@/lib/ika/calculations';
import { revalidatePath } from 'next/cache';

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
      .select('role, upt_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'Profil pengguna tidak ditemukan.' };
    }

    if (profile.role === 'PIMPINAN') {
      return { success: false, error: 'Role Pimpinan bersifat read-only dan tidak dapat mengirim laporan.' };
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

    revalidatePath('/input');
    revalidatePath('/laporan');
    revalidatePath('/dashboard');

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

