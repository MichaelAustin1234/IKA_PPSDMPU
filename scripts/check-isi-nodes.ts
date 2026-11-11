import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLaporanIsiNodes() {
  const { data: isi } = await supabase.from('laporan_isi').select('node_id, nilai_angka, keterangan');
  console.log('Total baris di laporan_isi saat ini:', isi?.length || 0);

  if (isi && isi.length > 0) {
    const nodeIds = [...new Set(isi.map((i) => i.node_id))];
    const { data: nodes } = await supabase
      .from('indikator_node')
      .select('id, kode, nama, level, parent_id')
      .in('id', nodeIds);

    console.log('Node yang dipakai di laporan_isi:');
    nodes?.forEach((n) => {
      console.log(` - ID: ${n.id} | Kode: ${n.kode} | Level: ${n.level} | Nama: ${n.nama}`);
    });
  }
}

checkLaporanIsiNodes().catch(console.error);
