// scripts/seed-ika01.ts
// Skrip langsung untuk seeding pohon IKA.01 ke Supabase
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('🚀 Memulai seeding pohon IKA.01 ke Supabase...');

  // Hapus data IKA.01 yang mungkin sudah ada sebelumnya untuk menghindari duplikasi
  const { data: existingIka } = await supabase
    .from('indikator_node')
    .select('id')
    .eq('kode', 'IKA.01');

  if (existingIka && existingIka.length > 0) {
    console.log('⚠️ Menghapus data indikator lama IKA.01...');
    await supabase.from('indikator_node').delete().eq('kode', 'IKA.01');
  }

  // 0. SKA
  let skaId: string;
  const { data: existingSka } = await supabase
    .from('indikator_node')
    .select('id')
    .eq('kode', 'SKA.01')
    .single();

  if (existingSka) {
    skaId = existingSka.id;
  } else {
    const { data: ska, error: errSka } = await supabase
      .from('indikator_node')
      .insert({
        kode: 'SKA.01',
        nama: 'Meningkatkan kualitas pendidikan dan pelatihan SDM transportasi udara',
        level: 'SKA',
        bobot: 1.0,
        tipe_input: 'TURUNAN',
        cap_100: false,
        urutan: 1,
      })
      .select('id')
      .single();
    if (errSka) throw errSka;
    skaId = ska.id;
  }

  // 1. IKA.01
  const { data: ika01, error: errIka } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: skaId,
      kode: 'IKA.01',
      nama: 'Indeks Kompetensi SDM Transportasi Udara',
      level: 'IKA',
      bobot: 1.0,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 100,
      urutan: 1,
    })
    .select('id')
    .single();
  if (errIka) throw errIka;
  const ika01Id = ika01.id;

  // ==========================================
  // KOMPONEN A
  // ==========================================
  const { data: kompA } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: ika01Id,
      kode: 'A',
      nama: 'Tingkat Kelulusan',
      level: 'KOMPONEN',
      bobot: 0.2,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 100,
      urutan: 1,
    })
    .select('id')
    .single();
  const aId = kompA!.id;

  const { data: subA1 } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: aId,
      kode: 'A.1',
      nama: 'Persentase Lulusan Tepat Waktu',
      level: 'SUB',
      bobot: 0.6,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 100,
      urutan: 1,
    })
    .select('id')
    .single();

  const { data: subA2 } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: aId,
      kode: 'A.2',
      nama: 'Persentase Lulusan dengan IPK >= 3,0',
      level: 'SUB',
      bobot: 0.4,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 80,
      max_nilai: 100,
      urutan: 2,
    })
    .select('id')
    .single();

  await supabase.from('indikator_node').insert([
    { parent_id: aId, kode: 'A_LULUS', nama: 'Jumlah Lulusan', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 1 },
    { parent_id: subA1!.id, kode: 'A_TEPAT', nama: 'Jumlah Lulusan Tepat Waktu', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 2 },
    { parent_id: subA2!.id, kode: 'A_IPK_35', nama: 'Jumlah Lulusan dengan IPK >= 3,5 - 4,0', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 3 },
    { parent_id: subA2!.id, kode: 'A_IPK_30', nama: 'Jumlah Lulusan dengan IPK >= 3,0 dan IPK < 3,5', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 4 },
    { parent_id: subA2!.id, kode: 'A_IPK_275', nama: 'Jumlah Lulusan dengan IPK >= 2,75 dan IPK < 3', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 5 },
    { parent_id: subA2!.id, kode: 'A_IPK_KURANG', nama: 'Jumlah Lulusan dengan IPK < 2,75', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 6 },
  ]);

  // ==========================================
  // KOMPONEN B
  // ==========================================
  const { data: kompB } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: ika01Id,
      kode: 'B',
      nama: 'Tingkat Pencapaian Sertifikasi Kompetensi',
      level: 'KOMPONEN',
      bobot: 0.2,
      tipe_input: 'ANGKA',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 100,
      urutan: 2,
      catatan: 'Nilai diinput manual pada Excel sumber — didukung sub B.1 dan B.2',
    })
    .select('id')
    .single();
  const bId = kompB!.id;

  const { data: subB1 } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: bId,
      kode: 'B.1',
      nama: 'Tingkat Lulusan Pendidikan dengan Sertifikasi Kompetensi',
      level: 'SUB',
      bobot: 0.3,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 100,
      urutan: 1,
    })
    .select('id')
    .single();

  const { data: subB11 } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: subB1!.id,
      kode: 'B.1.1',
      nama: 'Persentase Lulusan Pendidikan Tersertifikasi Kompetensi Nasional',
      level: 'SUB',
      bobot: 0.8,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 95,
      urutan: 1,
    })
    .select('id')
    .single();

  const { data: subB12 } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: subB1!.id,
      kode: 'B.1.2',
      nama: 'Persentase Lulusan Pendidikan Tersertifikasi Kompetensi Internasional',
      level: 'SUB',
      bobot: 0.2,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 5,
      urutan: 2,
    })
    .select('id')
    .single();

  await supabase.from('indikator_node').insert([
    { parent_id: subB11!.id, kode: 'B1_NASIONAL', nama: 'Jumlah lulusan pendidikan yang memiliki sertifikat kompetensi berstandar nasional', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 1 },
    { parent_id: subB12!.id, kode: 'B1_INTERNASIONAL', nama: 'Jumlah lulusan pendidikan yang memiliki sertifikat kompetensi berstandar internasional', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 2 },
  ]);

  const { data: subB2 } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: bId,
      kode: 'B.2',
      nama: 'Tingkat Lulusan Pelatihan dengan Sertifikasi Kompetensi',
      level: 'SUB',
      bobot: 0.7,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 100,
      urutan: 2,
    })
    .select('id')
    .single();

  const { data: subB21 } = await supabase
    .from('indikator_node')
    .insert({ parent_id: subB2!.id, kode: 'B.2.1', nama: 'Persentase Lulusan Pelatihan Teknis Tersertifikasi Nasional', level: 'SUB', bobot: 0.2, tipe_input: 'TURUNAN', cap_100: true, min_nilai: 0, max_nilai: 20, urutan: 1 })
    .select('id').single();

  const { data: subB22 } = await supabase
    .from('indikator_node')
    .insert({ parent_id: subB2!.id, kode: 'B.2.2', nama: 'Persentase Lulusan Pelatihan Teknis Tersertifikasi Internasional', level: 'SUB', bobot: 0.1, tipe_input: 'TURUNAN', cap_100: true, min_nilai: 0, max_nilai: 10, urutan: 2 })
    .select('id').single();

  const { data: subB23 } = await supabase
    .from('indikator_node')
    .insert({ parent_id: subB2!.id, kode: 'B.2.3', nama: 'Persentase Lulusan Pelatihan Teknis', level: 'SUB', bobot: 0.7, tipe_input: 'TURUNAN', cap_100: true, min_nilai: 0, max_nilai: 70, urutan: 3 })
    .select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: subB2!.id, kode: 'B2_PESERTA', nama: 'Jumlah Peserta Pelatihan', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 1 },
    { parent_id: subB21!.id, kode: 'B2_LULUS_NAS', nama: 'Jumlah Lulusan Pelatihan Teknis Tersertifikasi Nasional (BNSP / DJU)', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 2 },
    { parent_id: subB22!.id, kode: 'B2_LULUS_INT', nama: 'Jumlah Lulusan Pelatihan Teknis Tersertifikasi Internasional', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 3 },
    { parent_id: subB23!.id, kode: 'B2_LULUS_NON', nama: 'Jumlah Lulusan Pelatihan Teknis Non-Sertifikasi', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 4 },
  ]);

  // ==========================================
  // KOMPONEN C
  // ==========================================
  const { data: kompC } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: ika01Id,
      kode: 'C',
      nama: 'Tingkat Penyerapan Lulusan',
      level: 'KOMPONEN',
      bobot: 0.3,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 100,
      urutan: 3,
      catatan: 'Jika C.1 >= 100 maka C dikunci = 100',
    })
    .select('id')
    .single();
  const cId = kompC!.id;

  // C.6: Leaf acuan
  const { data: c6Ref } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: cId,
      kode: 'C.6',
      nama: 'Jumlah lulusan sampai dengan tahun t',
      level: 'LEAF',
      bobot: 0,
      tipe_input: 'ANGKA',
      cap_100: true,
      min_nilai: 0,
      urutan: 6,
    })
    .select('id')
    .single();

  await supabase.from('indikator_node').insert([
    { parent_id: cId, kode: 'C.1', nama: 'Jumlah Lulusan Bekerja <= 6 bulan (75%)', level: 'LEAF', bobot: 0.800, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, max_ref_node_id: c6Ref!.id, max_persen: 0.75, urutan: 1 },
    { parent_id: cId, kode: 'C.2', nama: 'Jumlah Lulusan Bekerja > 6 bulan s.d 12 bulan (20%)', level: 'LEAF', bobot: 0.160, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, max_ref_node_id: c6Ref!.id, max_persen: 0.20, urutan: 2 },
    { parent_id: cId, kode: 'C.3', nama: 'Jumlah Lulusan Bekerja > 12 bulan s.d 18 bulan (3%)', level: 'LEAF', bobot: 0.024, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, max_ref_node_id: c6Ref!.id, max_persen: 0.03, urutan: 3 },
    { parent_id: cId, kode: 'C.4', nama: 'Jumlah Lulusan Bekerja > 18 bulan s.d 24 bulan (2%)', level: 'LEAF', bobot: 0.016, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, max_ref_node_id: c6Ref!.id, max_persen: 0.02, urutan: 4 },
    { parent_id: cId, kode: 'C.5', nama: 'Jumlah Lulusan Bekerja > 24 bulan atau belum bekerja (0%)', level: 'LEAF', bobot: 0.000, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, urutan: 5 },
  ]);

  // ==========================================
  // KOMPONEN D
  // ==========================================
  const { data: kompD } = await supabase
    .from('indikator_node')
    .insert({
      parent_id: ika01Id,
      kode: 'D',
      nama: 'Tingkat Kepuasan Pengguna Lulusan',
      level: 'KOMPONEN',
      bobot: 0.3,
      tipe_input: 'TURUNAN',
      cap_100: true,
      min_nilai: 0,
      max_nilai: 100,
      urutan: 4,
    })
    .select('id')
    .single();
  const dId = kompD!.id;

  await supabase.from('indikator_node').insert([
    { parent_id: dId, kode: 'D.1', nama: 'Aspek Kompetensi', level: 'LEAF', bobot: 0.4, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, max_nilai: 4, urutan: 1 },
    { parent_id: dId, kode: 'D.2', nama: 'Aspek Kinerja', level: 'LEAF', bobot: 0.3, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, max_nilai: 4, urutan: 2 },
    { parent_id: dId, kode: 'D.3', nama: 'Aspek Etos Kerja', level: 'LEAF', bobot: 0.3, tipe_input: 'ANGKA', cap_100: true, min_nilai: 0, max_nilai: 4, urutan: 3 },
  ]);

  // ==========================================
  // Hubungkan ke seluruh UPT di node_upt
  // ==========================================
  const { data: upts } = await supabase.from('upt').select('id');
  const { data: allNodes } = await supabase.from('indikator_node').select('id');

  if (upts && allNodes) {
    const nodeUptRows = [];
    for (const upt of upts) {
      for (const node of allNodes) {
        nodeUptRows.push({
          upt_id: upt.id,
          node_id: node.id,
          berlaku: true,
        });
      }
    }
    await supabase.from('node_upt').upsert(nodeUptRows, { onConflict: 'node_id,upt_id' });
    console.log(`✅ Berhasil menghubungkan ${nodeUptRows.length} relasi node_upt.`);
  }

  console.log('🎉 Seeding pohon IKA.01 selesai dengan sukses!');
}

runSeed().catch((err) => {
  console.error('❌ Gagal seeding:', err);
  process.exit(1);
});
