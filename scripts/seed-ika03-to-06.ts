// scripts/seed-ika03-to-06.ts
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('🚀 Memulai seeding pohon IKA.03, IKA.04, IKA.05, dan IKA.06...');

  // ==========================================
  // IKA.03
  // ==========================================
  const { data: ska03 } = await supabase.from('indikator_node').insert({
    kode: 'SKA.03',
    nama: 'Terwujudnya Kebijakan Pengembangan SDM yang Menunjang Kebijakan Sektor Transportasi Udara',
    level: 'SKA',
    bobot: 1.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    urutan: 3,
  }).select('id').single();

  const { data: ika03 } = await supabase.from('indikator_node').insert({
    parent_id: ska03!.id,
    kode: 'IKA.03',
    nama: 'Indeks Kebijakan Pengembangan SDM Transportasi Udara',
    level: 'IKA',
    bobot: 1.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 3,
  }).select('id').single();

  const { data: k3a } = await supabase.from('indikator_node').insert({
    parent_id: ika03!.id,
    kode: 'IKA.03.A',
    nama: 'Tingkat Keselarasan Kebijakan',
    level: 'KOMPONEN',
    bobot: 0.3,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 1,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k3a!.id, kode: 'IKA.03.A.1', nama: 'Jumlah Skor Aspek Kebijakan yang Selaras', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 1 },
    { parent_id: k3a!.id, kode: 'IKA.03.A.2', nama: 'Jumlah Aspek Kebijakan', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 2 },
  ]);

  const { data: k3b } = await supabase.from('indikator_node').insert({
    parent_id: ika03!.id,
    kode: 'IKA.03.B',
    nama: 'Tingkat Relevansi Kebijakan',
    level: 'KOMPONEN',
    bobot: 0.3,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 2,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k3b!.id, kode: 'IKA.03.B.1', nama: 'Jumlah Skor Aspek Kebijakan yang Relevan', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 1 },
    { parent_id: k3b!.id, kode: 'IKA.03.B.2', nama: 'Jumlah Aspek Kebijakan', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 2 },
  ]);

  const { data: k3c } = await supabase.from('indikator_node').insert({
    parent_id: ika03!.id,
    kode: 'IKA.03.C',
    nama: 'Tingkat Efektivitas Kebijakan (Rata-rata 4 Skor IKA.01)',
    level: 'KOMPONEN',
    bobot: 0.3,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 3,
    catatan: 'Turunan dari 4 komponen IKA.01 (A, B, C, D)',
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k3c!.id, kode: 'IKA.03.C.1', nama: 'Turunan Skor Kelulusan (IKA.01.A)', level: 'LEAF', bobot: 0.25, tipe_input: 'TURUNAN', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 1 },
    { parent_id: k3c!.id, kode: 'IKA.03.C.2', nama: 'Turunan Skor Sertifikasi (IKA.01.B)', level: 'LEAF', bobot: 0.25, tipe_input: 'TURUNAN', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 2 },
    { parent_id: k3c!.id, kode: 'IKA.03.C.3', nama: 'Turunan Skor Penyerapan (IKA.01.C)', level: 'LEAF', bobot: 0.25, tipe_input: 'TURUNAN', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 3 },
    { parent_id: k3c!.id, kode: 'IKA.03.C.4', nama: 'Turunan Skor Kepuasan (IKA.01.D)', level: 'LEAF', bobot: 0.25, tipe_input: 'TURUNAN', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 4 },
  ]);

  const { data: k3d } = await supabase.from('indikator_node').insert({
    parent_id: ika03!.id,
    kode: 'IKA.03.D',
    nama: 'Tingkat Keterlibatan Industri dalam Perumusan Kebijakan',
    level: 'KOMPONEN',
    bobot: 0.1,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 4,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k3d!.id, kode: 'IKA.03.D.1', nama: 'Jumlah Bentuk Keterlibatan Industri Terjalin', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 1 },
    { parent_id: k3d!.id, kode: 'IKA.03.D.2', nama: 'Jumlah Bentuk Keterlibatan Industri Mungkin Terjalin', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 2 },
  ]);

  // ==========================================
  // IKA.04
  // ==========================================
  const { data: ska04 } = await supabase.from('indikator_node').insert({
    kode: 'SKA.04',
    nama: 'Meningkatnya Kualitas Pelayanan, Pengembangan, Pendidikan dan Pelatihan Transportasi Udara',
    level: 'SKA',
    bobot: 1.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    urutan: 4,
  }).select('id').single();

  const { data: ika04 } = await supabase.from('indikator_node').insert({
    parent_id: ska04!.id,
    kode: 'IKA.04',
    nama: 'Indeks Kualitas Layanan Pendidikan dan Pelatihan SDM',
    level: 'IKA',
    bobot: 1.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 4,
  }).select('id').single();

  // 4.A
  const { data: k4a } = await supabase.from('indikator_node').insert({
    parent_id: ika04!.id,
    kode: 'IKA.04.A',
    nama: 'Tingkat Kepuasan Peserta Didik terhadap Layanan Diklat',
    level: 'KOMPONEN',
    bobot: 0.25,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 1,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k4a!.id, kode: 'IKA.04.A.1', nama: 'Rata-Rata Skor Kepuasan Peserta Didik', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 1 },
    { parent_id: k4a!.id, kode: 'IKA.04.A.2', nama: 'Jumlah Responden Peserta Didik', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 2 },
  ]);

  // 4.B
  const { data: k4b } = await supabase.from('indikator_node').insert({
    parent_id: ika04!.id,
    kode: 'IKA.04.B',
    nama: 'Tingkat Sertifikasi Tenaga Pendidik',
    level: 'KOMPONEN',
    bobot: 0.25,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 2,
  }).select('id').single();

  const { data: b3Ref } = await supabase.from('indikator_node').insert({
    parent_id: k4b!.id,
    kode: 'IKA.04.B.3',
    nama: 'Jumlah Dosen / Instruktur',
    level: 'LEAF',
    bobot: 0,
    tipe_input: 'ANGKA',
    cap_100: false,
    min_nilai: 0,
    urutan: 3,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k4b!.id, kode: 'IKA.04.B.1', nama: 'Jumlah Dosen Berkualifikasi (95%)', level: 'LEAF', bobot: 0.5, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_ref_node_id: b3Ref!.id, max_persen: 0.95, urutan: 1 },
    { parent_id: k4b!.id, kode: 'IKA.04.B.2', nama: 'Jumlah Dosen Tersertifikasi (85%)', level: 'LEAF', bobot: 0.5, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_ref_node_id: b3Ref!.id, max_persen: 0.85, urutan: 2 },
  ]);

  // 4.C
  const { data: k4c } = await supabase.from('indikator_node').insert({
    parent_id: ika04!.id,
    kode: 'IKA.04.C',
    nama: 'Tingkat Ketersediaan dan Kelayakan Sarana Prasarana',
    level: 'KOMPONEN',
    bobot: 0.25,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 3,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k4c!.id, kode: 'IKA.04.C.1.1', nama: 'Jumlah Fasilitas Utama Pembelajaran', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 1 },
    { parent_id: k4c!.id, kode: 'IKA.04.C.1.2', nama: 'Jumlah Fasilitas Penunjang Pembelajaran', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 2 },
    { parent_id: k4c!.id, kode: 'IKA.04.C.2.1', nama: 'Jumlah Fasilitas Utama yang Layak', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 3 },
    { parent_id: k4c!.id, kode: 'IKA.04.C.2.2', nama: 'Jumlah Fasilitas Penunjang yang Layak', level: 'LEAF', bobot: 0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, urutan: 4 },
  ]);

  // 4.D
  const { data: k4d } = await supabase.from('indikator_node').insert({
    parent_id: ika04!.id,
    kode: 'IKA.04.D',
    nama: 'Persentase Penerapan Standar Mutu di UPT Matra Udara',
    level: 'KOMPONEN',
    bobot: 0.25,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 4,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k4d!.id, kode: 'IKA.04.D.1', nama: 'Penerapan Standar Mutu ISO 9001', level: 'LEAF', bobot: 0.25, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 9, urutan: 1 },
    { parent_id: k4d!.id, kode: 'IKA.04.D.2', nama: 'Kepatuhan Standar Nasional Diklat Transportasi Udara', level: 'LEAF', bobot: 0.25, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 18, urutan: 2 },
    { parent_id: k4d!.id, kode: 'IKA.04.D.3', nama: 'Pelaksanaan Audit Internal dan Eksternal Berkala', level: 'LEAF', bobot: 0.25, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 9, urutan: 3 },
    { parent_id: k4d!.id, kode: 'IKA.04.D.4', nama: 'Efektivitas Tindakan Perbaikan dan Pencegahan (CAPA)', level: 'LEAF', bobot: 0.25, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 9, urutan: 4 },
  ]);

  // ==========================================
  // IKA.05
  // ==========================================
  const { data: ska05 } = await supabase.from('indikator_node').insert({
    kode: 'SKA.05',
    nama: 'Terwujudnya Organisasi yang Agile dan SDM Unggul di Bidang Transportasi Udara',
    level: 'SKA',
    bobot: 1.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    urutan: 5,
  }).select('id').single();

  await supabase.from('indikator_node').insert({
    parent_id: ska05!.id,
    kode: 'IKA.05',
    nama: 'Indeks Profesionalisme ASN',
    level: 'IKA',
    bobot: 1.0,
    tipe_input: 'ANGKA',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 5,
    catatan: 'Rata-rata 9 unit, diinput langsung per UPT',
  });

  // ==========================================
  // IKA.06
  // ==========================================
  const { data: ska06 } = await supabase.from('indikator_node').insert({
    kode: 'SKA.06',
    nama: 'Terwujudnya Birokrasi yang Akuntabel dan Berorientasi pada Layanan Prima',
    level: 'SKA',
    bobot: 1.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    urutan: 6,
  }).select('id').single();

  const { data: ika06 } = await supabase.from('indikator_node').insert({
    parent_id: ska06!.id,
    kode: 'IKA.06',
    nama: 'Indeks Akuntabilitas PPSDMPU / UPT',
    level: 'IKA',
    bobot: 1.0,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 6,
  }).select('id').single();

  // 6.A SAKIP
  await supabase.from('indikator_node').insert({
    parent_id: ika06!.id,
    kode: 'IKA.06.A',
    nama: 'Nilai SAKIP UPT',
    level: 'LEAF',
    bobot: 0.25,
    tipe_input: 'ANGKA',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 1,
  });

  // 6.B IKPA
  const { data: k6b } = await supabase.from('indikator_node').insert({
    parent_id: ika06!.id,
    kode: 'IKA.06.B',
    nama: 'Nilai Indeks Kinerja Pengelolaan Anggaran (IKPA)',
    level: 'KOMPONEN',
    bobot: 0.25,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 2,
  }).select('id').single();

  const { data: sub6b1 } = await supabase.from('indikator_node').insert({
    parent_id: k6b!.id,
    kode: 'IKA.06.B.1',
    nama: 'Kualitas Perencanaan Anggaran',
    level: 'SUB',
    bobot: 0.25,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 25,
    urutan: 1,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: sub6b1!.id, kode: 'IKA.06.B.1.1', nama: 'Revisi DIPA', level: 'LEAF', bobot: 0.4, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 1 },
    { parent_id: sub6b1!.id, kode: 'IKA.06.B.1.2', nama: 'Deviasi Halaman III DIPA', level: 'LEAF', bobot: 0.6, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 2 },
  ]);

  const { data: sub6b2 } = await supabase.from('indikator_node').insert({
    parent_id: k6b!.id,
    kode: 'IKA.06.B.2',
    nama: 'Kualitas Pelaksanaan Anggaran',
    level: 'SUB',
    bobot: 0.50,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 50,
    urutan: 2,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: sub6b2!.id, kode: 'IKA.06.B.2.1', nama: 'Penyerapan Anggaran', level: 'LEAF', bobot: 0.4, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 1 },
    { parent_id: sub6b2!.id, kode: 'IKA.06.B.2.2', nama: 'Belanja Kontraktual', level: 'LEAF', bobot: 0.2, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 2 },
    { parent_id: sub6b2!.id, kode: 'IKA.06.B.2.3', nama: 'Penyelesaian Tagihan', level: 'LEAF', bobot: 0.2, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 3 },
    { parent_id: sub6b2!.id, kode: 'IKA.06.B.2.4', nama: 'Pengelolaan UP dan TUP', level: 'LEAF', bobot: 0.2, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 4 },
  ]);

  const { data: sub6b3 } = await supabase.from('indikator_node').insert({
    parent_id: k6b!.id,
    kode: 'IKA.06.B.3',
    nama: 'Kualitas Hasil Pelaksanaan Anggaran',
    level: 'SUB',
    bobot: 0.25,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 25,
    urutan: 3,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: sub6b3!.id, kode: 'IKA.06.B.3.1', nama: 'Capaian Output', level: 'LEAF', bobot: 1.0, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 100, urutan: 1 },
  ]);

  // 6.C Kearsipan
  await supabase.from('indikator_node').insert({
    parent_id: ika06!.id,
    kode: 'IKA.06.C',
    nama: 'Nilai Indeks Kearsipan UPT',
    level: 'LEAF',
    bobot: 0.25,
    tipe_input: 'ANGKA',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 100,
    urutan: 3,
  });

  // 6.D Maturitas BLU
  const { data: k6d } = await supabase.from('indikator_node').insert({
    parent_id: ika06!.id,
    kode: 'IKA.06.D',
    nama: 'Nilai Indeks Maturitas BLU UPT',
    level: 'KOMPONEN',
    bobot: 0.25,
    tipe_input: 'TURUNAN',
    cap_100: false,
    min_nilai: 0,
    max_nilai: 5,
    urutan: 4,
  }).select('id').single();

  await supabase.from('indikator_node').insert([
    { parent_id: k6d!.id, kode: 'IKA.06.D.1', nama: 'Aspek Keuangan (20%)', level: 'LEAF', bobot: 0.20, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 5, urutan: 1 },
    { parent_id: k6d!.id, kode: 'IKA.06.D.2', nama: 'Aspek Pelayanan / Operasional (25%)', level: 'LEAF', bobot: 0.25, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 5, urutan: 2 },
    { parent_id: k6d!.id, kode: 'IKA.06.D.3', nama: 'Aspek Kapabilitas Internal (20%)', level: 'LEAF', bobot: 0.20, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 5, urutan: 3 },
    { parent_id: k6d!.id, kode: 'IKA.06.D.4', nama: 'Aspek Tata Kelola dan Kepemimpinan (20%)', level: 'LEAF', bobot: 0.20, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 5, urutan: 4 },
    { parent_id: k6d!.id, kode: 'IKA.06.D.5', nama: 'Aspek Inovasi (10%)', level: 'LEAF', bobot: 0.10, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 5, urutan: 5 },
    { parent_id: k6d!.id, kode: 'IKA.06.D.6', nama: 'Aspek Lingkungan (5%)', level: 'LEAF', bobot: 0.05, tipe_input: 'ANGKA', cap_100: false, min_nilai: 0, max_nilai: 5, urutan: 6 },
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
    console.log(`✅ Berhasil menghubungkan relasi node_upt.`);
  }

  console.log('🎉 Seeding pohon IKA.03, IKA.04, IKA.05, dan IKA.06 selesai!');
}

runSeed().catch((err) => {
  console.error('❌ Gagal seeding:', err);
  process.exit(1);
});
