import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabase = createClient(
  'https://hpegzhzxzqzyrvhhfsoa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNzg4NjQsImV4cCI6MjEwNjc1NDg2NH0.w_GPWsVvRErsKhImkaJuwHI-NoQBRlz7vdZSC9KoOdc'
);

async function testSuperAdmin() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@ppsdmpu.go.id',
    password: 'Admin123!',
  });
  console.log('Login SuperAdmin:', auth?.user?.id, authErr);

  const { data: profile, error: errProf } = await supabase
    .from('profiles')
    .select('*, upt:upt_id(*)')
    .eq('id', auth.user!.id)
    .single();
  console.log('Profile:', profile, errProf);

  const { data: laporan, error: errLap } = await supabase
    .from('laporan')
    .select('*, upt:upt_id(*)')
    .order('submitted_at', { ascending: false });
  console.log('Laporan count:', laporan?.length, 'error:', errLap, 'data:', laporan);
}

testSuperAdmin();
