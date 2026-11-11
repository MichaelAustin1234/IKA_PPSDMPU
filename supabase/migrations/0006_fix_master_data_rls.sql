-- 0006_fix_master_data_rls.sql
-- Izinkan authenticated users membaca tabel master data referensi umum

alter table periode enable row level security;
drop policy if exists "periode_read_all" on periode;
create policy "periode_read_all" on periode
  for select to authenticated using (true);

alter table predikat_konversi enable row level security;
drop policy if exists "predikat_konversi_read_all" on predikat_konversi;
create policy "predikat_konversi_read_all" on predikat_konversi
  for select to authenticated using (true);

alter table node_upt enable row level security;
drop policy if exists "node_upt_read_all" on node_upt;
create policy "node_upt_read_all" on node_upt
  for select to authenticated using (true);

alter table target_tahunan enable row level security;
drop policy if exists "target_tahunan_read_all" on target_tahunan;
create policy "target_tahunan_read_all" on target_tahunan
  for select to authenticated using (true);
