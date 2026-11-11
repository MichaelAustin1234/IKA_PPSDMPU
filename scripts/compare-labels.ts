import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

interface CsvRow {
  ika: string;
  kode: string;
  nama: string;
  tipe: string;
  bobot: string;
  min: string;
  max: string;
  catatan: string;
  barisExcel: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    let cur = '';
    let inQuotes = false;
    const parts: string[] = [];
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
    rows.push({
      ika: parts[0] || '',
      kode: parts[1] || '',
      nama: (parts[2] || '').replace(/^"|"$/g, '').trim(),
      tipe: parts[3] || '',
      bobot: parts[4] || '',
      min: parts[5] || '',
      max: parts[6] || '',
      catatan: (parts[9] || '').replace(/^"|"$/g, '').trim(),
      barisExcel: parts[10] || '',
    });
  }
  return rows;
}

async function main() {
  const csvRaw = fs.readFileSync(path.resolve(process.cwd(), 'kamus_data_leaf_node_ika.csv'), 'utf-8');
  const csvRows = parseCsv(csvRaw);

  const { data: nodes } = await supabase.from('indikator_node').select('*');
  if (!nodes) return;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

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

  // Canonical roots
  const prefixes = ['af0f3e46', 'f500562d', '8763bd96', '6b168521', 'd4d7722e', 'f2b77800'];
  const canonicalSkaIds = new Set<string>();
  for (const p of prefixes) {
    const ika = nodes.find(n => n.id.startsWith(p));
    if (ika?.parent_id) canonicalSkaIds.add(ika.parent_id);
  }

  const canonicalIds = new Set<string>();
  function addRec(id: string) {
    canonicalIds.add(id);
    nodes!.filter(n => n.parent_id === id).forEach(c => addRec(c.id));
  }
  canonicalSkaIds.forEach(id => addRec(id));
  const canonicalNodes = nodes.filter(n => canonicalIds.has(n.id));

  // Output Markdown Table for IKA.03
  console.log('### TABEL PERBANDINGAN LABEL IKA.03 (10 LEAF + 4 KOMPONEN)\n');
  console.log('| Jalur Kode (Path) | Kode DB | Label di Database Saat Ini | Label di Excel / CSV | Baris Excel | Status |');
  console.log('|---|---|---|---|---|---|');

  // IKA.03 nodes in canonical DB
  const ika03Nodes = canonicalNodes
    .filter(n => getPath(n.id).includes('IKA.03') && n.level !== 'SKA' && n.level !== 'IKA')
    .sort((a, b) => getPath(a.id).localeCompare(getPath(b.id)));

  // Map to CSV rows
  const ika03Csv = csvRows.filter(r => r.ika === 'IKA.03');
  
  for (const n of ika03Nodes) {
    const p = getPath(n.id);
    // Extract relative code like A, A.1, B, B.1, etc.
    const relCode = n.kode.replace(/^IKA\.03\./, '');
    const csvMatch = ika03Csv.find(r => r.kode === relCode || r.kode === n.kode);
    const excelLabel = csvMatch ? csvMatch.nama : '-';
    const excelRow = csvMatch ? csvMatch.barisExcel : '-';
    const isSame = n.nama.trim().toLowerCase() === excelLabel.trim().toLowerCase();
    const status = isSame ? '✅ Sama' : '⚠️ Beda';
    console.log(`| \`${p}\` | \`${n.kode}\` | ${n.nama} | ${excelLabel} | ${excelRow} | ${status} |`);
  }

  console.log('\n\n### TABEL PERBANDINGAN LABEL IKA.04 (13 LEAF + 4 KOMPONEN)\n');
  console.log('| Jalur Kode (Path) | Kode DB | Label di Database Saat Ini | Label di Excel / CSV | Baris Excel | Status |');
  console.log('|---|---|---|---|---|---|');

  const ika04Nodes = canonicalNodes
    .filter(n => getPath(n.id).includes('IKA.04') && n.level !== 'SKA' && n.level !== 'IKA')
    .sort((a, b) => getPath(a.id).localeCompare(getPath(b.id)));

  const ika04Csv = csvRows.filter(r => r.ika === 'IKA.04');

  for (const n of ika04Nodes) {
    const p = getPath(n.id);
    const relCode = n.kode.replace(/^IKA\.04\./, '');
    // Match CSV
    let csvMatch = ika04Csv.find(r => r.kode === relCode || r.kode === n.kode);
    if (!csvMatch && n.kode === 'IKA.04.A.1') {
      csvMatch = ika04Csv.find(r => r.barisExcel === '120'); // Rata-Rata Skor Kepuasan
    }
    if (!csvMatch && n.kode === 'IKA.04.A.2') {
      csvMatch = ika04Csv.find(r => r.barisExcel === '119'); // Jumlah Responden
    }
    const excelLabel = csvMatch ? csvMatch.nama : '-';
    const excelRow = csvMatch ? csvMatch.barisExcel : '-';
    const isSame = n.nama.trim().toLowerCase() === excelLabel.trim().toLowerCase();
    const status = isSame ? '✅ Sama' : '⚠️ Beda';
    console.log(`| \`${p}\` | \`${n.kode}\` | ${n.nama} | ${excelLabel} | ${excelRow} | ${status} |`);
  }
}

main().catch(console.error);
