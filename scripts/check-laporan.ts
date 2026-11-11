import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLaporan() {
  const { data: lap } = await supabase.from('laporan').select('id, status, upt_id, periode_id');
  const { data: hitung } = await supabase.from('hasil_hitung').select('id');
  console.log('Total baris di laporan:', lap?.length || 0);
  console.log('Total baris di hasil_hitung:', hitung?.length || 0);
}

checkLaporan().catch(console.error);
