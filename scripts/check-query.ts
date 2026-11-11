import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabase = createClient(
  'https://hpegzhzxzqzyrvhhfsoa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs'
);

async function check() {
  const { data: leafNodes, error: err1 } = await supabase
    .from('indikator_node')
    .select('kode, nama, level, tipe_input')
    .eq('level', 'LEAF')
    .in('tipe_input', ['ANGKA', 'PREDIKAT']);
  console.log('Leaf nodes count:', leafNodes?.length, 'error:', err1);

  const { data: periode, error: err2 } = await supabase
    .from('periode')
    .select('*')
    .eq('tahun', 2026)
    .eq('triwulan', 2)
    .single();
  console.log('Periode 2026-Q2:', periode, 'error:', err2);

  const { data: upt, error: err3 } = await supabase
    .from('upt')
    .select('*')
    .order('kode')
    .limit(1)
    .single();
  console.log('UPT:', upt, 'error:', err3);
}

check();
