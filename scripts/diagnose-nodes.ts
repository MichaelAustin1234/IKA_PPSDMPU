import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnose() {
  console.log('🔍 [Langkah 1: Diagnosa Read-Only] Mengaudit Tabel indikator_node...\n');

  // 1. Ambil semua node
  const { data: allNodes, error: errNodes } = await supabase
    .from('indikator_node')
    .select('id, parent_id, kode, nama, level, tipe_input, urutan');

  if (errNodes || !allNodes) {
    console.error('❌ Gagal membaca indikator_node:', errNodes);
    return;
  }

  console.log(`📊 Total baris di indikator_node: ${allNodes.length}`);

  // 2. Hitung jumlah node per level
  const levelCounts: Record<string, number> = {};
  allNodes.forEach((n) => {
    levelCounts[n.level] = (levelCounts[n.level] || 0) + 1;
  });
  console.log('📈 Jumlah node per level:', levelCounts);

  // 3. Cari duplikasi berdasarkan (parent_id, kode) dan juga (level, kode)
  const mapParentKode: Record<string, typeof allNodes> = {};
  const mapLevelKode: Record<string, typeof allNodes> = {};

  allNodes.forEach((n) => {
    const keyPK = `${n.parent_id || 'ROOT'}:::${n.kode}`;
    if (!mapParentKode[keyPK]) mapParentKode[keyPK] = [];
    mapParentKode[keyPK].push(n);

    const keyLK = `${n.level}:::${n.kode}`;
    if (!mapLevelKode[keyLK]) mapLevelKode[keyLK] = [];
    mapLevelKode[keyLK].push(n);
  });

  const dupsParentKode = Object.entries(mapParentKode).filter(([, list]) => list.length > 1);
  const dupsLevelKode = Object.entries(mapLevelKode).filter(([, list]) => list.length > 1);

  console.log(`\n🔎 Duplikasi per (parent_id, kode): ${dupsParentKode.length} grup`);
  console.log(`🔎 Duplikasi per (level, kode): ${dupsLevelKode.length} grup`);

  // 4. Periksa keterikatan data ke laporan_isi, hasil_hitung, dan node_upt
  const { data: allLaporanIsi } = await supabase.from('laporan_isi').select('node_id');
  const { data: allHasilHitung } = await supabase.from('hasil_hitung').select('node_id');
  const { data: allNodeUpt } = await supabase.from('node_upt').select('node_id, upt_id, berlaku');

  const isiCountByNode: Record<string, number> = {};
  allLaporanIsi?.forEach((r) => {
    isiCountByNode[r.node_id] = (isiCountByNode[r.node_id] || 0) + 1;
  });

  const hitungCountByNode: Record<string, number> = {};
  allHasilHitung?.forEach((r) => {
    hitungCountByNode[r.node_id] = (hitungCountByNode[r.node_id] || 0) + 1;
  });

  const nodeUptCountByNode: Record<string, number> = {};
  allNodeUpt?.forEach((r) => {
    nodeUptCountByNode[r.node_id] = (nodeUptCountByNode[r.node_id] || 0) + 1;
  });

  if (dupsParentKode.length > 0) {
    console.log('\n⚠️ RINCIAN DUPLIKAT (parent_id + kode):');
    for (const [key, list] of dupsParentKode.slice(0, 10)) {
      console.log(`\n• Key [${key}] (Duplikat: ${list.length} baris):`);
      for (const n of list) {
        console.log(`   - ID: ${n.id} | Level: ${n.level} | Nama: "${n.nama}"`);
        console.log(`     Keterikatan -> laporan_isi: ${isiCountByNode[n.id] || 0}, hasil_hitung: ${hitungCountByNode[n.id] || 0}, node_upt: ${nodeUptCountByNode[n.id] || 0}`);
      }
    }
    if (dupsParentKode.length > 10) {
      console.log(`\n... dan ${dupsParentKode.length - 10} grup duplikat lainnya.`);
    }
  } else {
    console.log('\n✅ Tidak ditemukan duplikasi pada kombinasi (parent_id, kode).');
  }

  // 5. Cek SKA & IKA level atas
  console.log('\n🌳 Node Level Tertinggi (SKA & IKA):');
  const topNodes = allNodes.filter((n) => n.level === 'SKA' || n.level === 'IKA');
  topNodes.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  topNodes.forEach((n) => {
    console.log(` - [${n.level}] Kode: ${n.kode.padEnd(7)} | Parent: ${n.parent_id ? n.parent_id.slice(0, 8) : 'ROOT    '} | ID: ${n.id.slice(0, 8)} | Nama: ${n.nama}`);
  });
}

runDiagnose().catch(console.error);
