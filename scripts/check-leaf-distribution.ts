import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function detailLeaves() {
  const { data: nodes } = await supabase.from('indikator_node').select('id, parent_id, kode, nama, level, urutan');
  if (!nodes) return;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function getRootIka(nodeId: string): string {
    let curr = nodeMap.get(nodeId);
    while (curr) {
      if (curr.level === 'IKA') return `${curr.kode} (${curr.id.slice(0, 8)})`;
      if (!curr.parent_id) break;
      curr = nodeMap.get(curr.parent_id);
    }
    return 'UNKNOWN';
  }

  const leaves = nodes.filter(n => n.level === 'LEAF');
  const leavesByIka: Record<string, number> = {};
  leaves.forEach(l => {
    const ika = getRootIka(l.id);
    leavesByIka[ika] = (leavesByIka[ika] || 0) + 1;
  });

  console.log('Distribusi Leaf Node per Pohon IKA:');
  for (const [ika, count] of Object.entries(leavesByIka)) {
    console.log(` - ${ika}: ${count} leaf nodes`);
  }
}

detailLeaves().catch(console.error);
