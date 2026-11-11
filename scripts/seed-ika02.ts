// scripts/seed-ika02.ts
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('🚀 Memulai seeding pohon IKA.02 ke Supabase (Opsi B: Replika Eksak Formula Excel)...');

  // SKA.02
  const { data: ska02 } = await supabase.from('indikator_node').insert({
    kode: 'SKA.02',
    nama: 'Meningkatnya Akreditasi Lembaga Pendidikan Vokasi, Sertifikasi Pelatihan dan Tenaga Kerja Sektor Transportasi Udara',
    level: 'SKA',
    bobot: 1.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    urutan: 2,
  }).select('id').single();

  // IKA.02
  const { data: ika02 } = await supabase.from('indikator_node').insert({
    parent_id: ska02!.id,
    kode: 'IKA.02',
    nama: 'Indeks Akreditasi dan Sertifikasi Lembaga Pendidikan dan Pelatihan',
    level: 'IKA',
    bobot: 1.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 2,
  }).select('id').single();

  // 2.A: Akreditasi Institusi
  const { data: k2a } = await supabase.from('indikator_node').insert({
    parent_id: ika02!.id,
    kode: 'IKA.02.A',
    nama: 'Tingkat Akreditasi Institusi',
    level: 'KOMPONEN',
    bobot: 0.3,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 4,
    urutan: 1,
    catatan: 'Formula Excel sumber Opsi B: IF(rata-rata < 3, rata-rata + 1, 0)',
  }).select('id').single();

  const uptList = [
    { kode: 'IKA.02.A.1', nama: 'Akreditasi Institusi PPI Curug', urutan: 1 },
    { kode: 'IKA.02.A.2', nama: 'Akreditasi Institusi Poltekbang Surabaya', urutan: 2 },
    { kode: 'IKA.02.A.3', nama: 'Akreditasi Institusi Poltekbang Medan', urutan: 3 },
    { kode: 'IKA.02.A.4', nama: 'Akreditasi Institusi Poltekbang Makassar', urutan: 4 },
    { kode: 'IKA.02.A.5', nama: 'Akreditasi Institusi Poltekbang Palembang', urutan: 5 },
    { kode: 'IKA.02.A.6', nama: 'Akreditasi Institusi Poltekbang Jayapura', urutan: 6 },
    { kode: 'IKA.02.A.7', nama: 'Akreditasi Institusi API Banyuwangi', urutan: 7 },
  ];

  await supabase.from('indikator_node').insert(
    uptList.map(u => ({
      parent_id: k2a!.id,
      kode: u.kode,
      nama: u.nama,
      level: 'LEAF' as const,
      bobot: 1.0 / 7.0,
      tipe_input: 'PREDIKAT' as const,
      cap_100: false,
      min_nilai: 0,
      max_nilai: 4,
      urutan: u.urutan,
    }))
  );

  // 2.B: Akreditasi Prodi
  const { data: k2b } = await supabase.from('indikator_node').insert({
    parent_id: ika02!.id,
    kode: 'IKA.02.B',
    nama: 'Tingkat Akreditasi Program Studi',
    level: 'KOMPONEN',
    bobot: 0.3,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 2,
    catatan: 'Formula Excel sumber Opsi B: IF(rata-rata < 3.5, rata-rata + 0.5, 0)',
  }).select('id').single();

  // B.1 PPI Curug (10 prodi)
  const { data: subB1 } = await supabase.from('indikator_node').insert({
    parent_id: k2b!.id,
    kode: 'IKA.02.B.1',
    nama: 'Akreditasi Prodi PPI Curug',
    level: 'SUB',
    bobot: 1.0 / 7.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 4,
    urutan: 1,
  }).select('id').single();

  const prodiCurug = [
    'D-III Teknik Mekanikal Bandara',
    'D-III Teknik Bangunan dan Landasan',
    'D-III Penerangan Aeronautika',
    'D-III Pertolongan Kecelakaan Pesawat',
    'D-III Operasi Bandar Udara',
    'D-IV Lalu Lintas Udara',
    'D-IV Penerbang',
    'D-IV Teknik Listrik Bandara',
    'D-IV Teknik Pesawat Udara',
    'D-IV Teknik Navigasi Udara',
  ];
  await supabase.from('indikator_node').insert(
    prodiCurug.map((nama, idx) => ({
      parent_id: subB1!.id,
      kode: `IKA.02.B.1.${idx + 1}`,
      nama,
      level: 'LEAF' as const,
      bobot: 0.1,
      tipe_input: 'PREDIKAT' as const,
      cap_100: false,
      urutan: idx + 1,
    }))
  );

  // B.2 Poltekbang Surabaya (7 prodi)
  const { data: subB2 } = await supabase.from('indikator_node').insert({
    parent_id: k2b!.id,
    kode: 'IKA.02.B.2',
    nama: 'Akreditasi Prodi Poltekbang Surabaya',
    level: 'SUB',
    bobot: 1.0 / 7.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 4,
    urutan: 2,
  }).select('id').single();

  const prodiSby = [
    'D-III Komunikasi Penerbangan',
    'D-III Lalu Lintas Udara',
    'D-III Manajemen Transportasi Udara',
    'D-III Teknik Bangunan dan Landasan',
    'D-III Teknik Listrik Bandara',
    'D-III Teknik Navigasi Udara',
    'D-III Teknik Pesawat Udara',
  ];
  await supabase.from('indikator_node').insert(
    prodiSby.map((nama, idx) => ({
      parent_id: subB2!.id,
      kode: `IKA.02.B.2.${idx + 1}`,
      nama,
      level: 'LEAF' as const,
      bobot: 1.0 / 7.0,
      tipe_input: 'PREDIKAT' as const,
      cap_100: false,
      urutan: idx + 1,
    }))
  );

  // B.3 Poltekbang Medan (4 prodi)
  const { data: subB3 } = await supabase.from('indikator_node').insert({
    parent_id: k2b!.id,
    kode: 'IKA.02.B.3',
    nama: 'Akreditasi Prodi Poltekbang Medan',
    level: 'SUB',
    bobot: 1.0 / 7.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 4,
    urutan: 3,
  }).select('id').single();

  const prodiMdn = [
    'D-III Pemanduan Lalu Lintas Udara',
    'D-III Teknik Telekomunikasi dan Navigasi Udara',
    'D-III Teknik Listrik Bandara',
    'D-III Teknologi Pemeliharaan Pesawat Udara',
  ];
  await supabase.from('indikator_node').insert(
    prodiMdn.map((nama, idx) => ({
      parent_id: subB3!.id,
      kode: `IKA.02.B.3.${idx + 1}`,
      nama,
      level: 'LEAF' as const,
      bobot: 0.25,
      tipe_input: 'PREDIKAT' as const,
      cap_100: false,
      urutan: idx + 1,
    }))
  );

  // B.4 Poltekbang Makassar (4 prodi)
  const { data: subB4 } = await supabase.from('indikator_node').insert({
    parent_id: k2b!.id,
    kode: 'IKA.02.B.4',
    nama: 'Akreditasi Prodi Poltekbang Makassar',
    level: 'SUB',
    bobot: 1.0 / 7.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 4,
    urutan: 4,
  }).select('id').single();

  const prodiMks = [
    'D-III Manajemen Lalu Lintas Udara',
    'D-III Teknologi Navigasi Udara',
    'D-III Teknologi Bandar Udara',
    'D-III Teknologi Pemeliharaan Pesawat Udara',
  ];
  await supabase.from('indikator_node').insert(
    prodiMks.map((nama, idx) => ({
      parent_id: subB4!.id,
      kode: `IKA.02.B.4.${idx + 1}`,
      nama,
      level: 'LEAF' as const,
      bobot: 0.25,
      tipe_input: 'PREDIKAT' as const,
      cap_100: false,
      urutan: idx + 1,
    }))
  );

  // B.5 Poltekbang Palembang (3 prodi)
  const { data: subB5 } = await supabase.from('indikator_node').insert({
    parent_id: k2b!.id,
    kode: 'IKA.02.B.5',
    nama: 'Akreditasi Prodi Poltekbang Palembang',
    level: 'SUB',
    bobot: 1.0 / 7.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 4,
    urutan: 5,
  }).select('id').single();

  const prodiPlb = [
    'D-III Manajemen Bandar Udara',
    'D-III Penyelamatan dan Pemadam Kebakaran Penerbangan',
    'D-IV Teknologi Rekayasa Bandar Udara',
  ];
  await supabase.from('indikator_node').insert(
    prodiPlb.map((nama, idx) => ({
      parent_id: subB5!.id,
      kode: `IKA.02.B.5.${idx + 1}`,
      nama,
      level: 'LEAF' as const,
      bobot: 1.0 / 3.0,
      tipe_input: 'PREDIKAT' as const,
      cap_100: false,
      urutan: idx + 1,
    }))
  );

  // B.6 Poltekbang Jayapura (3 prodi)
  const { data: subB6 } = await supabase.from('indikator_node').insert({
    parent_id: k2b!.id,
    kode: 'IKA.02.B.6',
    nama: 'Akreditasi Prodi Poltekbang Jayapura',
    level: 'SUB',
    bobot: 1.0 / 7.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 4,
    urutan: 6,
  }).select('id').single();

  const prodiJyp = [
    'D-III Manajemen Lalu Lintas Udara',
    'D-III Manajemen Bandar Udara',
    'D-III Teknik Listrik Bandara',
  ];
  await supabase.from('indikator_node').insert(
    prodiJyp.map((nama, idx) => ({
      parent_id: subB6!.id,
      kode: `IKA.02.B.6.${idx + 1}`,
      nama,
      level: 'LEAF' as const,
      bobot: 1.0 / 3.0,
      tipe_input: 'PREDIKAT' as const,
      cap_100: false,
      urutan: idx + 1,
    }))
  );

  // B.7 API Banyuwangi (2 prodi)
  const { data: subB7 } = await supabase.from('indikator_node').insert({
    parent_id: k2b!.id,
    kode: 'IKA.02.B.7',
    nama: 'Akreditasi Prodi API Banyuwangi',
    level: 'SUB',
    bobot: 1.0 / 7.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 4,
    urutan: 7,
  }).select('id').single();

  const prodiBwi = [
    'D-III Operasi Pesawat Udara',
    'D-III Penerbang Sayap Tetap',
  ];
  await supabase.from('indikator_node').insert(
    prodiBwi.map((nama, idx) => ({
      parent_id: subB7!.id,
      kode: `IKA.02.B.7.${idx + 1}`,
      nama,
      level: 'LEAF' as const,
      bobot: 0.5,
      tipe_input: 'PREDIKAT' as const,
      cap_100: false,
      urutan: idx + 1,
    }))
  );

  // 2.C: Sertifikasi Program Pelatihan
  const { data: k2c } = await supabase.from('indikator_node').insert({
    parent_id: ika02!.id,
    kode: 'IKA.02.C',
    nama: 'Tingkat Sertifikasi Program Pelatihan',
    level: 'KOMPONEN',
    bobot: 0.2,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 85,
    urutan: 3,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k2c!.id, kode: 'IKA.02.C.1', nama: 'Jumlah Program Pelatihan Tersertifikasi (Approval Ditjen Hubud / Internasional)', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 1 },
    { parent_id: k2c!.id, kode: 'IKA.02.C.2', nama: 'Total Program Pelatihan', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 2 },
  ]);

  // 2.D: Sertifikasi Tenaga Kerja
  const { data: k2d } = await supabase.from('indikator_node').insert({
    parent_id: ika02!.id,
    kode: 'IKA.02.D',
    nama: 'Tingkat Sertifikasi Tenaga Kerja',
    level: 'KOMPONEN',
    bobot: 0.2,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 85,
    urutan: 4,
    catatan: 'Bobot 0.2 sesuai kolom G Excel (label tertulis 0.30 adalah typo label Excel)',
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k2d!.id, kode: 'IKA.02.D.1.1', nama: 'Jumlah Lulusan Pelatihan dengan Status Pekerja (non-alumni)', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 1 },
    { parent_id: k2d!.id, kode: 'IKA.02.D.1.2', nama: 'Jumlah Serapan Lulusan Tersertifikasi', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 2 },
    { parent_id: k2d!.id, kode: 'IKA.02.D.2', nama: 'Jumlah Serapan Lulusan dan Peserta Pelatihan Tersertifikasi', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 3 },
  ]);

  // Hubungkan ke seluruh UPT di node_upt
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
    console.log(`✅ Berhasil menghubungkan relasi node_upt.`);
  }

  console.log('🎉 Seeding pohon IKA.02 (Opsi B: Replika formula Excel) selesai!');
}

runSeed().catch((err) => {
  console.error('❌ Gagal seeding IKA.02:', err);
  process.exit(1);
});
