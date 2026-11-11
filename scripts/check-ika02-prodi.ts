import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== 1. CEK ISI TABEL UPT ===');
  const { data: upts, error: uptError } = await supabase.from('upt').select('*').order('kode');
  if (uptError) {
    console.error('Error fetching upt:', uptError);
  } else {
    console.log(`Total baris di tabel upt: ${upts.length}`);
    upts.forEach((u, i) => {
      console.log(`  ${i + 1}. Kode: "${u.kode}" | Nama: "${u.nama}" | ID: ${u.id}`);
    });
  }

  console.log('\n=== 2. CEK LEAF IKA.02.B DI POHON KANONIKAL ===');
  // Ambil semua node
  const { data: allNodes } = await supabase.from('indikator_node').select('*');
  if (!allNodes) return;

  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  // Ambil akar IKA.02 kanonikal (prefix f500562d)
  const canonicalIka02 = allNodes.find(n => n.id.startsWith('f500562d'));
  console.log('Canonical IKA.02 ID:', canonicalIka02?.id, canonicalIka02?.kode);

  // Kumpulkan anak rekursif
  const canonicalIds = new Set<string>();
  function addRec(id: string) {
    canonicalIds.add(id);
    allNodes!.filter(n => n.parent_id === id).forEach(c => addRec(c.id));
  }
  if (canonicalIka02) addRec(canonicalIka02.id);

  const canonicalNodes = allNodes.filter(n => canonicalIds.has(n.id));
  const leaves02 = canonicalNodes.filter(n => n.level === 'LEAF');
  console.log(`Total LEAF di bawah IKA.02 kanonikal: ${leaves02.length}`);

  const prodiLeaves = canonicalNodes.filter(n => n.level === 'LEAF' && n.kode.startsWith('IKA.02.B.'));
  console.log(`Total LEAF prodi di bawah IKA.02.B kanonikal: ${prodiLeaves.length}`);

  // Breakdown per SUB di bawah B
  const subs = canonicalNodes.filter(n => n.level === 'SUB' && n.kode.startsWith('IKA.02.B.'));
  let totalCalculated = 0;
  for (const s of subs.sort((a, b) => a.kode.localeCompare(b.kode))) {
    const sLeaves = prodiLeaves.filter(l => l.parent_id === s.id);
    totalCalculated += sLeaves.length;
    console.log(`  - Sub ${s.kode} (${s.nama}): ${sLeaves.length} prodi`);
    sLeaves.forEach(l => console.log(`      * ${l.kode}: ${l.nama}`));
  }
  console.log(`Total prodi terhitung: ${totalCalculated}`);

  // Cek leaf IKA.02 non-prodi
  const nonProdiLeaves = leaves02.filter(l => !l.kode.startsWith('IKA.02.B.'));
  console.log(`\nLeaf IKA.02 non-prodi (${nonProdiLeaves.length} leaf):`);
  nonProdiLeaves.forEach(l => console.log(`  - ${l.kode} (${l.level}): ${l.nama}`));
}

main().catch(console.error);
