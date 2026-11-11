import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const [{ data: nodes }, { data: upts }, { data: nodeUpt }] = await Promise.all([
    supabase.from('indikator_node').select('*'),
    supabase.from('upt').select('*').order('kode'),
    supabase.from('node_upt').select('*'),
  ]);

  if (!nodes || !upts || !nodeUpt) return;
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // CSV
  const csvPath = path.resolve(process.cwd(), 'kamus_data_leaf_node_ika.csv');
  const csvRaw = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvRaw.split('\n').filter(l => l.trim().length > 0);
  
  // Parse lines
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
      barisExcel: parts[10] || '',
    };
  });

  console.log('=== IKA.03: SELURUH 10 LEAF NODE ===');
  // Ambil semua node yang kode atau parentnya di bawah IKA.03
  const ika03Nodes = nodes.filter(n => n.kode.startsWith('IKA.03') && n.level === 'LEAF');
  // Ambil yang unik berdasarkan kode
  const uniqueIka03Leaves = new Map<string, typeof nodes[0]>();
  ika03Nodes.forEach(n => {
    if (!uniqueIka03Leaves.has(n.kode)) uniqueIka03Leaves.set(n.kode, n);
  });
  console.log(`Jumlah leaf IKA.03 unik di DB: ${uniqueIka03Leaves.size}`);

  const sorted03 = Array.from(uniqueIka03Leaves.values()).sort((a,b) => a.kode.localeCompare(b.kode));
  for (const dbNode of sorted03) {
    const csvMatch = csvRows.find(r => r.ika === 'IKA.03' && (r.kode === dbNode.kode || dbNode.kode.endsWith(r.kode)));
    console.log(`Kode: ${dbNode.kode.padEnd(12)} | Excel: "${csvMatch?.nama || '-'}" | DB: "${dbNode.nama}"`);
  }

  console.log('\n=== IKA.04: SELURUH 13 LEAF NODE ===');
  const ika04Nodes = nodes.filter(n => n.kode.startsWith('IKA.04') && n.level === 'LEAF');
  const uniqueIka04Leaves = new Map<string, typeof nodes[0]>();
  ika04Nodes.forEach(n => {
    if (!uniqueIka04Leaves.has(n.kode)) uniqueIka04Leaves.set(n.kode, n);
  });
  console.log(`Jumlah leaf IKA.04 unik di DB: ${uniqueIka04Leaves.size}`);

  const sorted04 = Array.from(uniqueIka04Leaves.values()).sort((a,b) => a.kode.localeCompare(b.kode));
  for (const dbNode of sorted04) {
    const csvMatch = csvRows.find(r => r.ika === 'IKA.04' && (r.kode === dbNode.kode || dbNode.kode.endsWith(r.kode)));
    console.log(`Kode: ${dbNode.kode.padEnd(14)} | Excel: "${csvMatch?.nama || '-'}" | DB: "${dbNode.nama}"`);
  }

  // Cek D.1 dan D.2 di CSV vs DB
  console.log('\nCek D.1 dan D.2 di CSV untuk IKA.04:');
  const dItems = csvRows.filter(r => r.ika === 'IKA.04' && (r.kode.startsWith('D') || r.nama.includes('audit') || r.nama.includes('ISO') || r.nama.includes('standar')));
  dItems.forEach(d => {
    console.log(` - [${d.kode}] "${d.nama}" (tipe: ${d.tipe}, baris: ${d.barisExcel})`);
  });

  // Cek D items di DB
  console.log('\nCek D items di DB untuk IKA.04:');
  const dDbItems = nodes.filter(n => n.kode.startsWith('IKA.04.D'));
  dDbItems.forEach(d => {
    console.log(` - [${d.kode}] "${d.nama}" (level: ${d.level}, tipe: ${d.tipe_input})`);
  });

}

inspect().catch(console.error);
