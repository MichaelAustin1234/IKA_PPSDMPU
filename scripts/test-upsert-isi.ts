import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabase = createClient(
  'https://hpegzhzxzqzyrvhhfsoa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNzg4NjQsImV4cCI6MjEwNjc1NDg2NH0.w_GPWsVvRErsKhImkaJuwHI-NoQBRlz7vdZSC9KoOdc'
);

async function testInsertIsi() {
  const { data: auth } = await supabase.auth.signInWithPassword({
    email: 'admin.ppic@ppsdmpu.go.id',
    password: 'Ppic123!',
  });

  const { data: node } = await supabase.from('indikator_node').select('id').limit(1).single();

  const { data: res, error } = await supabase.from('laporan_isi').upsert([
    {
      laporan_id: '883f5871-ddc2-42b7-8dea-1be5186e6348',
      node_id: node!.id,
      nilai_angka: 85,
      sumber: 'MANUAL',
    }
  ], { onConflict: 'laporan_id,node_id' });

  console.log('Upsert result:', res, 'Error:', error);
}

testInsertIsi();
