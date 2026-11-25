-- 0012_create_audit_log.sql
-- Membuat tabel audit_log untuk mencatat peristiwa penting sistem IKA

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  user_nama text not null,
  role text not null,
  action text not null,
  target_type text,
  target_id text,
  keterangan text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- Index untuk performa query descending berdasarkan waktu
create index if not exists idx_audit_log_created_at on audit_log(created_at desc);
create index if not exists idx_audit_log_action on audit_log(action);

-- Aktifkan Row Level Security
alter table audit_log enable row level security;

-- Policy RLS: Hanya SUPER_ADMIN yang dapat membaca audit_log
drop policy if exists "super_admin_read_audit_log" on audit_log;
create policy "super_admin_read_audit_log" on audit_log
  for select to authenticated
  using (
    (select role from profiles where id = auth.uid()) = 'SUPER_ADMIN'
  );

-- Policy RLS: System/Service Role & Authenticated dapat melakukan insert
drop policy if exists "allow_insert_audit_log" on audit_log;
create policy "allow_insert_audit_log" on audit_log
  for insert to authenticated
  with check (true);
