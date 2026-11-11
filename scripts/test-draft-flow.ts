import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabase = createClient(
  'https://hpegzhzxzqzyrvhhfsoa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNzg4NjQsImV4cCI6MjEwNjc1NDg2NH0.w_GPWsVvRErsKhImkaJuwHI-NoQBRlz7vdZSC9KoOdc'
);

async function testDraft() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin.ppic@ppsdmpu.go.id',
    password: 'Ppic123!',
  });
  console.log('Login:', auth?.user?.id, authErr);

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, upt:upt_id(*)')
    .eq('id', auth.user!.id)
    .single();

  const { data: periode } = await supabase
    .from('periode')
    .select('*')
    .eq('tahun', 2026)
    .eq('triwulan', 2)
    .single();

  console.log('Periode from user client:', periode?.id);

  // Coba cek laporan yang ada
  const { data: lap, error: errLap } = await supabase
    .from('laporan')
    .select('*')
    .eq('upt_id', profile.upt_id)
    .eq('periode_id', 'ae004aa3-2cba-4424-8fea-efb61488ac0f');

  console.log('Existing laporan:', lap, errLap);
}

testDraft();
