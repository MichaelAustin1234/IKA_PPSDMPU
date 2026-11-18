-- 0011_add_admin_pusat_role.sql
-- Menambahkan role ADMIN_PUSAT ke tabel profiles dan memperbarui RLS policy

-- 1. Perbarui check constraint pada kolom role di tabel profiles
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check 
  check (role in ('SUPER_ADMIN', 'ADMIN_PUSAT', 'ADMIN_UPT', 'PIMPINAN'));

-- 2. Perbarui policy RLS pada tabel laporan agar ADMIN_PUSAT dan SUPER_ADMIN memiliki akses penuh
drop policy if exists "pusat_pimpinan_read" on laporan;
create policy "pusat_pimpinan_read" on laporan
  for select to authenticated
  using (
    (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN', 'ADMIN_PUSAT', 'PIMPINAN')
  );

drop policy if exists "super_admin_manage" on laporan;
create policy "super_admin_manage" on laporan
  for all to authenticated
  using (
    (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN', 'ADMIN_PUSAT')
  )
  with check (
    (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN', 'ADMIN_PUSAT')
  );

-- 3. Perbarui policy RLS pada tabel laporan_isi
drop policy if exists "pusat_pimpinan_read" on laporan_isi;
create policy "pusat_pimpinan_read" on laporan_isi
  for select to authenticated
  using (
    (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN', 'ADMIN_PUSAT', 'PIMPINAN')
  );

drop policy if exists "super_admin_manage" on laporan_isi;
create policy "super_admin_manage" on laporan_isi
  for all to authenticated
  using (
    (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN', 'ADMIN_PUSAT')
  )
  with check (
    (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN', 'ADMIN_PUSAT')
  );

-- 4. Perbarui policy RLS pada tabel hasil_hitung
drop policy if exists "pusat_pimpinan_read" on hasil_hitung;
create policy "pusat_pimpinan_read" on hasil_hitung
  for select to authenticated
  using (
    (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN', 'ADMIN_PUSAT', 'PIMPINAN')
  );

drop policy if exists "super_admin_manage" on hasil_hitung;
create policy "super_admin_manage" on hasil_hitung
  for all to authenticated
  using (
    (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN', 'ADMIN_PUSAT')
  )
  with check (
    (select role from profiles where id = auth.uid()) in ('SUPER_ADMIN', 'ADMIN_PUSAT')
  );
