import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- 1. ANALISIS kamus_data_leaf_node_ika.csv ---');
  const csvPath = path.resolve(process.cwd(), 'kamus_data_leaf_node_ika.csv');
  const csvRaw = fs.readFileSync(csvPath, 'utf-8');
  const allLines = csvRaw.split('\n');
  const nonEmptyLines = allLines.filter(l => l.trim().length > 0);
  console.log(`Total baris file: ${allLines.length}`);
  console.log(`Total baris tidak kosong: ${nonEmptyLines.length}`);
  console.log(`Baris header: 1 baris`);
  console.log(`Baris data riil: ${nonEmptyLines.length - 1} baris`);

  // Parse CSV
  // Header: ika,kode,nama,tipe_input,bobot,min,max,max_dinamis,cap_100,catatan,baris_excel
  const csvItems = nonEmptyLines.slice(1).map((line, idx) => {
    // split simple CSV
    // parse CSV with quotes
    const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
    // fallback split
    const parts: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
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
      rowNum: idx + 2,
      ika: parts[0] || '',
      kode: parts[1] || '',
      nama: (parts[2] || '').replace(/^"|"$/g, ''),
      tipeInput: parts[3] || '',
      bobot: parts[4] || '',
      min: parts[5] || '',
      max: parts[6] || '',
      cap100: parts[8] || '',
      barisExcel: parts[10] || '',
    };
  });

  const leafCsv = csvItems.filter(r => r.tipeInput === 'ANGKA' || r.tipeInput === 'PREDIKAT');
  console.log(`Leaf input di CSV (tipe ANGKA/PREDIKAT): ${leafCsv.length} baris`);

  // -------------------------------------------------------------
  // 2. AMBIL DATABASE
  // -------------------------------------------------------------
  const [{ data: nodes }, { data: nodeUpt }, { data: upts }] = await Promise.all([
    supabase.from('indikator_node').select('*'),
    supabase.from('node_upt').select('*'),
    supabase.from('upt').select('*').order('kode'),
  ]);

  if (!nodes || !nodeUpt || !upts) return;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function getRootIka(nodeId: string): { kode: string; id: string } | null {
    let curr = nodeMap.get(nodeId);
    while (curr) {
      if (curr.level === 'IKA') return { kode: curr.kode, id: curr.id };
      if (!curr.parent_id) break;
      curr = nodeMap.get(curr.parent_id);
    }
    return null;
  }

  // Cek 46 leaf tanpa node_upt
  const leafNodes = nodes.filter(n => n.level === 'LEAF');
  const nodeUptSet = new Set(nodeUpt.map(nu => nu.node_id));
  const leavesWithoutUpt = leafNodes.filter(l => !nodeUptSet.has(l.id));
  console.log(`\nTotal leaf di DB: ${leafNodes.length}`);
  console.log(`Leaf tanpa baris node_upt: ${leavesWithoutUpt.length}`);

  const noUptByIka: Record<string, number> = {};
  leavesWithoutUpt.forEach(l => {
    const root = getRootIka(l.id);
    const key = `${root?.kode} (${root?.id.slice(0, 8)})`;
    noUptByIka[key] = (noUptByIka[key] || 0) + 1;
  });
  console.log('Sebaran leaf tanpa node_upt per pohon IKA:');
  for (const [k, v] of Object.entries(noUptByIka)) {
    console.log(` - ${k}: ${v} leaf`);
  }

  // Tampilkan beberapa contoh leaf tanpa node_upt
  console.log('Contoh leaf tanpa node_upt:');
  leavesWithoutUpt.slice(0, 10).forEach(l => {
    const root = getRootIka(l.id);
    console.log(`   * [${root?.kode}] ${l.kode} - ${l.nama}`);
  });

  // -------------------------------------------------------------
  // 3. PERBANDINGAN LABEL IKA.03 DAN IKA.04 (CSV vs DB)
  // -------------------------------------------------------------
  console.log('\n--- 3. PERBANDINGAN LABEL IKA.03 & IKA.04 (EXCEL CSV VS DB) ---');
  console.log('\nIKA.03:');
  const csvIka03 = csvItems.filter(r => r.ika === 'IKA.03');
  for (const c of csvIka03) {
    // cari di DB
    const dbMatches = nodes.filter(n => {
      const root = getRootIka(n.id);
      return root?.kode === 'IKA.03' && (n.kode === c.kode || n.nama.toLowerCase().includes(c.nama.toLowerCase().slice(0, 15)));
    });
    const dbNames = [...new Set(dbMatches.map(m => `[${m.kode}] ${m.nama}`))];
    console.log(` - Excel: [${c.kode || '-'}] "${c.nama}" | DB: ${dbNames.join(' | ')}`);
  }

  console.log('\nIKA.04:');
  const csvIka04 = csvItems.filter(r => r.ika === 'IKA.04');
  for (const c of csvIka04) {
    const dbMatches = nodes.filter(n => {
      const root = getRootIka(n.id);
      return root?.kode === 'IKA.04' && (n.kode === c.kode || n.nama.toLowerCase().includes(c.nama.toLowerCase().slice(0, 15)));
    });
    const dbNames = [...new Set(dbMatches.map(m => `[${m.kode}] ${m.nama}`))];
    console.log(` - Excel: [${c.kode || '-'}] "${c.nama}" | DB: ${dbNames.join(' | ')}`);
  }

  // -------------------------------------------------------------
  // 4. HITUNG JUMLAH BARIS HARAPAN KANONIKAL
  // -------------------------------------------------------------
  console.log('\n--- 4. PERHITUNGAN BARIS HARAPAN SETELAH DEDUP ---');
  // Pilih salinan kanonik:
  // IKA.01: af0f3e46 (ska: a7d0d42f)
  // IKA.02: f500562d (ska: 375be678)
  // IKA.03: 8763bd96 (ska: d8ebb3d4)
  // IKA.04: 6b168521 (ska: 27d927d4)
  // IKA.05: d4d7722e (ska: f37f88f6)
  // IKA.06: f2b77800 (ska: 5df2620a)

  const canonicalIkaIds = new Set(['af0f3e46', 'f500562d', '8763bd96', '6b168521', 'd4d7722e', 'f2b77800']);
  const canonicalSkaIds = new Set(['a7d0d42f', '375be678', 'd8ebb3d4', '27d927d4', 'f37f88f6', '5df2620a']);

  const canonicalNodes = nodes.filter(n => {
    if (canonicalSkaIds.has(n.id)) return true;
    const root = getRootIka(n.id);
    return root && canonicalIkaIds.has(root.id.slice(0, 8));
  });

  const countByLevel: Record<string, number> = {};
  canonicalNodes.forEach(n => {
    countByLevel[n.level] = (countByLevel[n.level] || 0) + 1;
  });

  console.log('Jumlah node dalam Pohon Kanonikal yang Ditetapkan:');
  console.log(' - SKA:', countByLevel['SKA'] || 0);
  console.log(' - IKA:', countByLevel['IKA'] || 0);
  console.log(' - KOMPONEN:', countByLevel['KOMPONEN'] || 0);
  console.log(' - SUB:', countByLevel['SUB'] || 0);
  console.log(' - LEAF:', countByLevel['LEAF'] || 0);
  console.log(' TOTAL HARAPAN KANONIKAL:', canonicalNodes.length);
  console.log(` TOTAL DI DATABASE SEKARANG: ${nodes.length}`);
  console.log(` JUMLAH BARIS YANG AKAN DIHAPUS: ${nodes.length - canonicalNodes.length}`);

  // -------------------------------------------------------------
  // 5. DAFTAR UPT YANG BERLAKU PER LEAF SETELAH UNION
  // -------------------------------------------------------------
  console.log('\n--- 5. REKAP UPT YANG BERLAKU DI POHON KANONIKAL ---');
  const uptMap = new Map(upts.map(u => [u.id, u.kode]));

  // Buat mapping union dari seluruh salinan ke kanonikal berdasarkan jalur kode
  // Misal leaf jalur IKA.02 / B / B.1 ...
  for (const ikaKode of ['IKA.01', 'IKA.02', 'IKA.03', 'IKA.04', 'IKA.05', 'IKA.06']) {
    const cNodes = canonicalNodes.filter(n => {
      const root = getRootIka(n.id);
      return root?.kode === ikaKode && n.level === 'LEAF';
    });
    console.log(`\n• ${ikaKode} (${cNodes.length} leaf):`);
    for (const l of cNodes.slice(0, 5)) {
      // temukan semua UPT yang terhubung ke node ini atau ke kembarannya
      const kembaranIds = nodes.filter(n => n.level === 'LEAF' && n.kode === l.kode && n.nama === l.nama).map(n => n.id);
      const uptIds = [...new Set(nodeUpt.filter(nu => kembaranIds.includes(nu.node_id) && nu.berlaku).map(nu => uptMap.get(nu.upt_id)))];
      console.log(`   - [${l.kode || '-'}] ${l.nama.slice(0, 40)} -> UPT (${uptIds.length}): ${uptIds.join(', ') || 'TIDAK ADA BARIS (Universal)'}`);
    }
    if (cNodes.length > 5) {
      console.log(`   ... dan ${cNodes.length - 5} leaf lainnya`);
    }
  }
}

main().catch(console.error);
