-- 0001_init_schema.sql
-- Skema inti Sistem Informasi IKA PPSDMPU
-- Jalankan lewat Supabase SQL Editor atau `supabase db push`

create extension if not exists pgcrypto;

-- ============================================================
-- 1. PROFIL & AKUN (menempel ke auth.users bawaan Supabase)
-- ============================================================
create table upt (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null,        -- "PPIC", "POLTEKBANG_SBY", dst
  nama text not null
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role text not null check (role in ('ADMIN_UPT', 'SUPER_ADMIN', 'PIMPINAN')),
  upt_id uuid references upt(id),   -- wajib diisi jika role = ADMIN_UPT, null untuk role lain
  created_at timestamptz default now()
);

-- ============================================================
-- 2. STRUKTUR POHON INDIKATOR (inti dari sistem IKA)
-- ============================================================
create table indikator_node (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references indikator_node(id),
  kode text not null,                 -- "IKA.01", "A", "A.1"
  nama text not null,
  level text not null check (level in ('SKA','IKA','KOMPONEN','SUB','LEAF')),
  bobot numeric not null default 0,   -- bobot terhadap parent, total per parent WAJIB = 1.0
  tipe_input text not null check (tipe_input in ('ANGKA','PREDIKAT','TURUNAN')),
  cap_100 boolean not null default false,  -- hanya true untuk node di bawah IKA.01
  min_nilai numeric,
  max_nilai numeric,
  max_ref_node_id uuid references indikator_node(id),
  max_persen numeric,
  urutan int default 0,
  catatan text
);

create index on indikator_node (parent_id);

create table node_upt (
  node_id uuid references indikator_node(id) on delete cascade,
  upt_id uuid references upt(id) on delete cascade,
  berlaku boolean not null default true,
  primary key (node_id, upt_id)
);

create table predikat_konversi (
  id uuid primary key default gen_random_uuid(),
  jenis text not null,
  predikat text not null,
  skor numeric not null
);

-- ============================================================
-- 3. PERIODE & LAPORAN (siklus triwulanan)
-- ============================================================
create table periode (
  id uuid primary key default gen_random_uuid(),
  tahun int not null,
  triwulan int not null check (triwulan between 1 and 4),
  status text not null default 'BUKA' check (status in ('BUKA','TUTUP')),
  unique (tahun, triwulan)
);

create table laporan (
  id uuid primary key default gen_random_uuid(),
  upt_id uuid references upt(id) not null,
  periode_id uuid references periode(id) not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','APPROVED','REJECTED')),
  submitted_at timestamptz,
  reviewed_by uuid references profiles(id),
  catatan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (upt_id, periode_id)
);

create table laporan_isi (
  id uuid primary key default gen_random_uuid(),
  laporan_id uuid references laporan(id) on delete cascade,
  node_id uuid references indikator_node(id) not null,
  nilai_angka numeric,
  predikat_id uuid references predikat_konversi(id),
  sumber text not null default 'MANUAL' check (sumber in ('MANUAL','API')),
  keterangan text,
  updated_at timestamptz default now(),
  unique (laporan_id, node_id)
);

create table hasil_hitung (
  id uuid primary key default gen_random_uuid(),
  laporan_id uuid references laporan(id) on delete cascade,
  node_id uuid references indikator_node(id) not null,
  realisasi numeric,
  skor_normalisasi numeric,
  skor_terbobot numeric,
  dihitung_pada timestamptz default now(),
  unique (laporan_id, node_id)
);

create table target_tahunan (
  id uuid primary key default gen_random_uuid(),
  node_id uuid references indikator_node(id) not null,
  tahun int not null,
  target numeric not null,
  unique (node_id, tahun)
);

-- ============================================================
-- 4. KONFIGURASI API & LOG SINKRONISASI (boleh dikosongkan dulu)
-- ============================================================
create table upt_api_config (
  id uuid primary key default gen_random_uuid(),
  upt_id uuid references upt(id) unique,
  base_url text,
  auth_type text check (auth_type in ('API_KEY','BEARER')),
  secret_ref text,
  aktif boolean default false
);

create table sync_log (
  id uuid primary key default gen_random_uuid(),
  upt_id uuid references upt(id),
  periode_id uuid references periode(id),
  status text check (status in ('SUKSES','GAGAL','SEBAGIAN')),
  detail jsonb,
  dijalankan_pada timestamptz default now()
);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table laporan enable row level security;
alter table laporan_isi enable row level security;
alter table hasil_hitung enable row level security;
alter table indikator_node enable row level security;
alter table upt enable row level security;

-- profiles: setiap user hanya boleh baca profilnya sendiri (dipakai policy lain di bawah)
create policy "profiles_select_own" on profiles
  for select to authenticated
  using (id = auth.uid());

-- upt & indikator_node: semua role login boleh baca (dipakai untuk menyusun form/dashboard)
create policy "upt_read_all" on upt
  for select to authenticated using (true);

create policy "indikator_node_read_all" on indikator_node
  for select to authenticated using (true);

-- laporan: Admin UPT hanya akses miliknya sendiri; Super Admin & Pimpinan baca semua
create policy "laporan_admin_upt_rw" on laporan
  for all to authenticated
  using (
    upt_id = (select upt_id from profiles where id = auth.uid())
    or (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN','PIMPINAN')
  )
  with check (
    upt_id = (select upt_id from profiles where id = auth.uid())
    or (select role from profiles where id = auth.uid()) = 'SUPER_ADMIN'
  );

-- laporan_isi & hasil_hitung: ikut akses laporan induknya
create policy "laporan_isi_rw" on laporan_isi
  for all to authenticated
  using (
    laporan_id in (
      select id from laporan
      where upt_id = (select upt_id from profiles where id = auth.uid())
         or (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN','PIMPINAN')
    )
  )
  with check (
    laporan_id in (
      select id from laporan
      where upt_id = (select upt_id from profiles where id = auth.uid())
         or (select role from profiles where id = auth.uid()) = 'SUPER_ADMIN'
    )
  );

create policy "hasil_hitung_read" on hasil_hitung
  for select to authenticated
  using (
    laporan_id in (
      select id from laporan
      where upt_id = (select upt_id from profiles where id = auth.uid())
         or (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN','PIMPINAN')
    )
  );
