import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCsv(content: string) {
  const lines = content.split(/\r?\n/);
  const rows: any[] = [];
  let header: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let cur = '';
    let inQuotes = false;
    const parts: string[] = [];
    for (let c = 0; c < lines[i].length; c++) {
      const ch = lines[i][c];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    parts.push(cur.trim());
    if (i === 0) {
      header = parts;
    } else {
      rows.push({
        lineNum: i + 1,
        ika: parts[0] || '',
        kode: parts[1] || '',
        nama: (parts[2] || '').replace(/^"|"$/g, ''),
        tipe: parts[3] || '',
        bobot: parts[4] || '',
        barisExcel: parts[10] || '',
      });
    }
  }
  return { header, rows, totalRawLines: lines.length };
}

async function main() {
  const csvRaw = fs.readFileSync(path.resolve(process.cwd(), 'kamus_data_leaf_node_ika.csv'), 'utf-8');
  const { rows, totalRawLines } = parseCsv(csvRaw);

  console.log(`Total baris mentah di kamus_data_leaf_node_ika.csv: ${totalRawLines}`);
  console.log(`Total baris data CSV (non-header, non-kosong): ${rows.length}`);

  // Fetch Canonical DB Nodes
  const { data: allNodes } = await supabase.from('indikator_node').select('*');
  if (!allNodes) return;

  const prefixes = ['af0f3e46', 'f500562d', '8763bd96', '6b168521', 'd4d7722e', 'f2b77800'];
  const canonicalSkaIds = new Set<string>();
  for (const p of prefixes) {
    const ika = allNodes.find(n => n.id.startsWith(p));
    if (ika?.parent_id) canonicalSkaIds.add(ika.parent_id);
  }

  const canonicalIds = new Set<string>();
  function addRec(id: string) {
    canonicalIds.add(id);
    allNodes!.filter(n => n.parent_id === id).forEach(c => addRec(c.id));
  }
  canonicalSkaIds.forEach(id => addRec(id));
  const canonicalNodes = allNodes.filter(n => canonicalIds.has(n.id));

  const ikas = ['IKA.01', 'IKA.02', 'IKA.03', 'IKA.04', 'IKA.05', 'IKA.06'];

  console.log('\n========================================================================================');
  console.log('PERBANDINGAN DETAIL BARIS CSV (KAMUS DATA) VS LEAF/NODE DI DATABASE KANONIKAL');
  console.log('========================================================================================\n');

  for (const ika of ikas) {
    const csvIka = rows.filter(r => r.ika === ika);
    const dbIkaNodes = canonicalNodes.filter(n => {
      let curr: any = n;
      while (curr) {
        if (curr.level === 'IKA') return curr.kode === ika;
        curr = allNodes.find(x => x.id === curr.parent_id);
      }
      return false;
    });

    const csvLeaves = csvIka.filter(r => r.tipe === 'ANGKA' || r.tipe === 'PREDIKAT' || r.tipe === 'TURUNAN');
    const dbLeaves = dbIkaNodes.filter(n => n.level === 'LEAF');

    console.log(`----------------------------------------------------------------------------------------`);
    console.log(`${ika}:`);
    console.log(`  - Total Baris di CSV        : ${csvIka.length} baris`);
    console.log(`  - Baris Input/Leaf di CSV   : ${csvLeaves.length} baris (Tipe: ${Array.from(new Set(csvLeaves.map(r => r.tipe))).join(', ')})`);
    console.log(`  - Total Node di DB          : ${dbIkaNodes.length} node (termasuk IKA & Komponen)`);
    console.log(`  - Total LEAF di DB          : ${dbLeaves.length} leaf`);

    // Rincian khusus jika ada perbedaan
    if (ika === 'IKA.05') {
      console.log(`    ⚠️  Catatan IKA.05: Di CSV hanya 1 baris input ("${csvLeaves[0]?.nama}"), sedangkan di DB dipecah menjadi 9 LEAF (1 Pusat + 8 UPT satker BKN).`);
    } else if (ika === 'IKA.06') {
      console.log(`    ⚠️  Catatan IKA.06: Di CSV ada ${csvLeaves.length} baris input (${csvIka.length} total baris), sedangkan di DB saat ini hanya 15 LEAF (agregat 4 komponen SAKIP, IKPA, Kearsipan, BLU).`);
    }
  }

  // Baris di CSV yang tanpa IKA (misal header sasaran makro)
  const nonIkaRows = rows.filter(r => !r.ika);
  console.log(`\nBaris CSV tanpa kode IKA (Sasaran Makro/Header Renstra): ${nonIkaRows.length} baris`);
  nonIkaRows.forEach(r => console.log(`  - Baris Excel ${r.barisExcel}: "${r.nama}" (${r.tipe})`));
}

main().catch(console.error);
