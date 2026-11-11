import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabase = createClient(
  'https://hpegzhzxzqzyrvhhfsoa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNzg4NjQsImV4cCI6MjEwNjc1NDg2NH0.w_GPWsVvRErsKhImkaJuwHI-NoQBRlz7vdZSC9KoOdc'
);

async function testAsAuth() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin.ppic@ppsdmpu.go.id',
    password: 'Ppic123!',
  });
  console.log('Auth user:', authData?.user?.id, 'authErr:', authErr);

  const { data: profile, error: errProf } = await supabase
    .from('profiles')
    .select('*, upt:upt_id(*)')
    .eq('id', authData.user!.id)
    .single();
  console.log('Profile:', profile, 'errProf:', errProf);

  const { data: leafNodes, error: errLeaf } = await supabase
    .from('indikator_node')
    .select('*')
    .eq('level', 'LEAF')
    .in('tipe_input', ['ANGKA', 'PREDIKAT'])
    .order('urutan');
  console.log('Leaf nodes count:', leafNodes?.length, 'errLeaf:', errLeaf);

  const { data: predikat, error: errPred } = await supabase
    .from('predikat_konversi')
    .select('*');
  console.log('Predikat count:', predikat?.length, 'errPred:', errPred);

  const { data: periode, error: errPeriode } = await supabase
    .from('periode')
    .select('*')
    .eq('tahun', 2026)
    .eq('triwulan', 2)
    .single();
  console.log('Periode:', periode, 'errPeriode:', errPeriode);
}

testAsAuth();
