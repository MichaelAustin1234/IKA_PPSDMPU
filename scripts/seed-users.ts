// scripts/seed-users.ts
// Skrip untuk membuat akun pengguna awal (Super Admin, Pimpinan, dan Admin UPT)
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createOrUpdateUser(
  email: string,
  pass: string,
  nama: string,
  role: 'SUPER_ADMIN' | 'PIMPINAN' | 'ADMIN_UPT',
  uptKode?: string
) {
  // 1. Cek apakah user auth sudah ada
  const { data: usersData } = await supabase.auth.admin.listUsers();
  let user = usersData?.users.find((u) => u.email === email);

  if (!user) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      password: pass,
      email_confirm: true,
      user_metadata: { nama, role },
    });
    if (error) throw error;
    user = created.user;
    console.log(`✅ User auth dibuat: ${email}`);
  } else {
    console.log(`ℹ️ User auth sudah ada: ${email}`);
  }

  // 2. Dapatkan upt_id jika role ADMIN_UPT
  let uptId: string | null = null;
  if (uptKode) {
    const { data: upt } = await supabase
      .from('upt')
      .select('id')
      .eq('kode', uptKode)
      .single();
    uptId = upt?.id ?? null;
  }

  // 3. Masukkan/update ke tabel profiles
  const { error: profileErr } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      nama,
      role,
      upt_id: uptId,
    },
    { onConflict: 'id' }
  );

  if (profileErr) throw profileErr;
  console.log(`✅ Profile disinkronkan: ${nama} (${role})`);
}

async function run() {
  console.log('🚀 Menyiapkan akun awal sistem IKA...');

  // 1. Super Admin Pusat
  await createOrUpdateUser(
    'admin@ppsdmpu.go.id',
    'Admin123!',
    'Super Admin Pusat',
    'SUPER_ADMIN'
  );

  // 2. Pimpinan
  await createOrUpdateUser(
    'pimpinan@ppsdmpu.go.id',
    'Pimpinan123!',
    'Pimpinan PPSDMPU',
    'PIMPINAN'
  );

  // 3. Admin UPT PPI Curug
  await createOrUpdateUser(
    'admin.ppic@ppsdmpu.go.id',
    'Ppic123!',
    'Admin PPI Curug',
    'ADMIN_UPT',
    'PPIC'
  );

  // 4. Admin UPT Poltekbang Surabaya
  await createOrUpdateUser(
    'admin.sby@ppsdmpu.go.id',
    'Sby123!',
    'Admin Poltekbang Surabaya',
    'ADMIN_UPT',
    'POLTEKBANG_SBY'
  );

  // 5. Admin UPT Poltekbang Medan
  await createOrUpdateUser(
    'admin.mdn@ppsdmpu.go.id',
    'Mdn123!',
    'Admin Poltekbang Medan',
    'ADMIN_UPT',
    'POLTEKBANG_MDN'
  );

  // 6. Admin UPT Poltekbang Makassar
  await createOrUpdateUser(
    'admin.mks@ppsdmpu.go.id',
    'Mks123!',
    'Admin Poltekbang Makassar',
    'ADMIN_UPT',
    'POLTEKBANG_MKS'
  );

  // 7. Admin UPT Poltekbang Palembang
  await createOrUpdateUser(
    'admin.plb@ppsdmpu.go.id',
    'Plb123!',
    'Admin Poltekbang Palembang',
    'ADMIN_UPT',
    'POLTEKBANG_PLB'
  );

  // 8. Admin UPT Poltekbang Jayapura
  await createOrUpdateUser(
    'admin.jyp@ppsdmpu.go.id',
    'Jyp123!',
    'Admin Poltekbang Jayapura',
    'ADMIN_UPT',
    'POLTEKBANG_JYP'
  );

  // 9. Admin UPT API Banyuwangi
  await createOrUpdateUser(
    'admin.bwi@ppsdmpu.go.id',
    'Bwi123!',
    'Admin API Banyuwangi',
    'ADMIN_UPT',
    'API_BANYUWANGI'
  );

  // 10. Admin UPT BP3 Curug
  await createOrUpdateUser(
    'admin.bp3@ppsdmpu.go.id',
    'Bp3123!',
    'Admin BP3 Curug',
    'ADMIN_UPT',
    'BP3_CURUG'
  );

  console.log('\n🎉 Selesai! Seluruh akun siap digunakan.');
}

run().catch((err) => {
  console.error('❌ Gagal membuat akun:', err);
  process.exit(1);
});
