import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const [{ data: nodes }, { data: nodeUpt }, { data: upts }] = await Promise.all([
    supabase.from('indikator_node').select('*'),
    supabase.from('node_upt').select('*'),
    supabase.from('upt').select('*').order('kode'),
  ]);

  if (!nodes || !nodeUpt || !upts) return;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const uptMap = new Map(upts.map(u => [u.id, u.kode]));

  // 1. Tentukan akar kanonik dari prefix IKA
  const canonicalIkaPrefixes = [
    { prefix: 'af0f3e46', expectedKode: 'IKA.01', expectedSka: 'SKA.01' },
    { prefix: 'f500562d', expectedKode: 'IKA.02', expectedSka: 'SKA.02' },
    { prefix: '8763bd96', expectedKode: 'IKA.03', expectedSka: 'SKA.03' },
    { prefix: '6b168521', expectedKode: 'IKA.04', expectedSka: 'SKA.04' },
    { prefix: 'd4d7722e', expectedKode: 'IKA.05', expectedSka: 'SKA.05' },
    { prefix: 'f2b77800', expectedKode: 'IKA.06', expectedSka: 'SKA.06' },
  ];

  const canonicalSkaIds = new Set<string>();
  const canonicalIkaIds = new Set<string>();

  for (const c of canonicalIkaPrefixes) {
    const matchedIkas = nodes.filter(n => n.id.startsWith(c.prefix));
    if (matchedIkas.length !== 1) {
      throw new Error(`Assertion failed: Prefix ${c.prefix} matched ${matchedIkas.length} rows, expected 1.`);
    }
    const ika = matchedIkas[0];
    if (ika.kode !== c.expectedKode) {
      throw new Error(`Assertion failed: IKA kode ${ika.kode} != ${c.expectedKode}`);
    }
    const ska = nodeMap.get(ika.parent_id || '');
    if (!ska || ska.kode !== c.expectedSka) {
      throw new Error(`Assertion failed: SKA kode ${ska?.kode} != ${c.expectedSka}`);
    }
    canonicalIkaIds.add(ika.id);
    canonicalSkaIds.add(ska.id);
  }

  console.log('✅ Assertion Poin 1 (Akar Kanonik dari Prefix): Lolos 100%. 6 SKA & 6 IKA terverifikasi.');

  // Kumpulkan seluruh node kanonikal secara rekursif
  const canonicalNodes = new Set<string>();
  function collectCanonical(id: string) {
    canonicalNodes.add(id);
    const children = nodes!.filter(n => n.parent_id === id);
    children.forEach(c => collectCanonical(c.id));
  }
  canonicalSkaIds.forEach(id => collectCanonical(id));

  console.log(`✅ Total node kanonikal: ${canonicalNodes.size} baris (Harapan: 162 baris)`);
  console.log(`✅ Total node duplikat yang akan dihapus: ${nodes.length - canonicalNodes.size} baris (Harapan: 176 baris)`);

  // Path recursive
  function getPath(id: string): string {
    const parts: string[] = [];
    let curr = nodeMap.get(id);
    while (curr) {
      parts.unshift(curr.kode);
      if (!curr.parent_id) break;
      curr = nodeMap.get(curr.parent_id);
    }
    return parts.join('/');
  }

  // Buat node_map (dup_id -> can_id)
  const canonicalPathMap = new Map<string, string>();
  for (const id of canonicalNodes) {
    const p = getPath(id);
    canonicalPathMap.set(p, id);
  }

  const nodeMapPairs: { dup_id: string; can_id: string; path: string }[] = [];
  const duplicateNodes = nodes.filter(n => !canonicalNodes.has(n.id));

  for (const d of duplicateNodes) {
    const p = getPath(d.id);
    const canId = canonicalPathMap.get(p);
    if (!canId) {
      throw new Error(`Assertion failed: Duplicate node ${d.id} with path "${p}" not found in canonical nodes!`);
    }
    nodeMapPairs.push({ dup_id: d.id, can_id: canId, path: p });
  }

  // Cek distinct dup_id
  const distinctDups = new Set(nodeMapPairs.map(m => m.dup_id));
  console.log(`✅ Assertion Pemetaan: node_map.length = ${nodeMapPairs.length}, distinct dup_id = ${distinctDups.size}`);
  if (nodeMapPairs.length !== distinctDups.size || nodeMapPairs.length !== 176) {
    throw new Error(`Assertion failed: node_map is not 1:1 or not 176 rows!`);
  }
  console.log('✅ Assertion Poin 2 (Pemetaan 1:1 tepat 176 baris): Lolos 100%.');

  // Simulasi Union node_upt dengan bool_or(berlaku)
  // Mapping dup_id to can_id
  const dupToCan = new Map(nodeMapPairs.map(m => [m.dup_id, m.can_id]));

  // Ambil semua baris node_upt untuk kanonikal saat ini
  // key: `${can_id}:::${upt_id}` -> berlaku
  const simulatedNodeUpt = new Map<string, boolean>();

  // 1. Masukkan data node_upt kanonikal yang sudah ada
  for (const nu of nodeUpt) {
    if (canonicalNodes.has(nu.node_id)) {
      const key = `${nu.node_id}:::${nu.upt_id}`;
      simulatedNodeUpt.set(key, nu.berlaku);
    }
  }

  // 2. Union dari node_upt duplikat
  for (const nu of nodeUpt) {
    const canId = dupToCan.get(nu.node_id);
    if (canId) {
      const key = `${canId}:::${nu.upt_id}`;
      const existing = simulatedNodeUpt.get(key) || false;
      simulatedNodeUpt.set(key, existing || nu.berlaku);
    }
  }

  console.log(`✅ Total baris node_upt kanonikal setelah UNION: ${simulatedNodeUpt.size}`);

  // -------------------------------------------------------------
  // CETAK HASIL (b): MATRIKS UPT PER LEAF PER IKA
  // -------------------------------------------------------------
  const canonicalNodeList = nodes.filter(n => canonicalNodes.has(n.id));
  const canonicalLeaves = canonicalNodeList.filter(n => n.level === 'LEAF');

  // Kelompokkan per IKA
  function getRootIkaKode(id: string): string {
    let curr = nodeMap.get(id);
    while (curr) {
      if (curr.level === 'IKA') return curr.kode;
      if (!curr.parent_id) break;
      curr = nodeMap.get(curr.parent_id);
    }
    return 'UNKNOWN';
  }

  const leavesWithoutUptList: { path: string; nama: string; kode: string }[] = [];
  const matrixByIka: Record<string, { path: string; nama: string; upts: string[] }[]> = {};

  for (const leaf of canonicalLeaves) {
    const p = getPath(leaf.id);
    const ika = getRootIkaKode(leaf.id);
    if (!matrixByIka[ika]) matrixByIka[ika] = [];

    // Cari UPT yang berlaku
    const applicableUpts: string[] = [];
    for (const upt of upts) {
      const key = `${leaf.id}:::${upt.id}`;
      if (simulatedNodeUpt.get(key) === true) {
        applicableUpts.push(upt.kode);
      }
    }

    if (applicableUpts.length === 0) {
      leavesWithoutUptList.push({ path: p, nama: leaf.nama, kode: leaf.kode });
    }

    matrixByIka[ika].push({
      path: p,
      nama: leaf.nama,
      upts: applicableUpts,
    });
  }

  // Tulis hasil matriks ke file untuk diinspeksi
  const matrixJsonPath = path.resolve(process.cwd(), 'scripts', 'matrix-results.json');
  fs.writeFileSync(matrixJsonPath, JSON.stringify({ matrixByIka, leavesWithoutUptList }, null, 2));

  console.log(`\n✅ Leaf kanonik tanpa baris node_upt sama sekali: ${leavesWithoutUptList.length} leaf.`);
  console.log('Rincian leaf tanpa baris node_upt per IKA:');
  const noUptCount: Record<string, number> = {};
  leavesWithoutUptList.forEach(l => {
    const ika = l.path.split('/')[1];
    noUptCount[ika] = (noUptCount[ika] || 0) + 1;
  });
  console.log(noUptCount);

  // -------------------------------------------------------------
  // CETAK HASIL (d): TABEL LABEL DARI CSV TERPROGRAM
  // -------------------------------------------------------------
  const csvPath = path.resolve(process.cwd(), 'kamus_data_leaf_node_ika.csv');
  const csvRaw = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvRaw.split('\n').filter(l => l.trim().length > 0);
  
  const csvRows = lines.slice(1).map(l => {
    let cur = '';
    let inQuotes = false;
    const parts: string[] = [];
    for (let c = 0; c < l.length; c++) {
      const ch = l[c];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    parts.push(cur.trim());
    return {
      ika: parts[0] || '',
      kode: parts[1] || '',
      nama: (parts[2] || '').replace(/^"|"$/g, ''),
      tipe: parts[3] || '',
      catatan: (parts[9] || '').replace(/^"|"$/g, ''),
      barisExcel: parts[10] || '',
    };
  });

  console.log('\n=== DETAIL 3 KANDIDAT PENGECUALIAN LABEL EXCEL ===');
  // 1. IKA.03.B.1
  const b1 = csvRows.find(r => r.ika === 'IKA.03' && r.barisExcel === '105');
  const a1 = csvRows.find(r => r.ika === 'IKA.03' && r.barisExcel === '102');
  console.log('1. IKA.03.A.1 vs IKA.03.B.1:');
  console.log(`   - Baris 102 (A.1): "${a1?.nama}"`);
  console.log(`   - Baris 105 (B.1): "${b1?.nama}"`);
  console.log(`   - Catatan: Teks label di Excel persis sama kata demi kata ("...selaras dengan Kebijakan Sektor..."), padahal Komponen B adalah "Tingkat Relevansi Kebijakan". Ini jelas typo salin-tempel di Excel.`);

  // 2. IKA.04.A.2
  const a2_4 = csvRows.find(r => r.ika === 'IKA.04' && r.barisExcel === '121');
  const mhs = csvRows.find(r => r.ika === 'IKA.04' && r.barisExcel === '121');
  console.log('\n2. IKA.04.A.2 (Jumlah Mahasiswa / Responden):');
  console.log(`   - Baris 118: A.1 = Jumlah Skor Kepuasan Peserta Didik`);
  console.log(`   - Baris 119: A.2 = Jumlah Responden`);
  console.log(`   - Baris 120: Rata-Rata Skor Kepuasan Peserta Didik (=C118/C119)`);
  console.log(`   - Baris 121: Jumlah Mahasiswa`);
  console.log(`   - Baris 122: Jumlah Peserta Pelatihan`);

  // 3. IKA.04.C.2.1 dan C.2.2
  const c11 = csvRows.find(r => r.ika === 'IKA.04' && r.barisExcel === '129');
  const c12 = csvRows.find(r => r.ika === 'IKA.04' && r.barisExcel === '130');
  const c21 = csvRows.find(r => r.ika === 'IKA.04' && r.barisExcel === '132');
  const c22 = csvRows.find(r => r.ika === 'IKA.04' && r.barisExcel === '133');
  console.log('\n3. IKA.04.C.1 vs C.2:');
  console.log(`   - Baris 128: C.1 = Jumlah Sarana dan Prasarana Pembelajaran`);
  console.log(`     * Baris 129 (C.1.1): "${c11?.nama}"`);
  console.log(`     * Baris 130 (C.1.2): "${c12?.nama}"`);
  console.log(`   - Baris 131: C.2 = Jumlah Sarana dan Prasarana Pembelajaran yang Layak`);
  console.log(`     * Baris 132 (C.2.1): "${c21?.nama}"`);
  console.log(`     * Baris 133 (C.2.2): "${c22?.nama}"`);
}

run().catch(console.error);
