-- 0002_seed_master_data.sql
-- Seed data yang sudah pasti/tetap: 8 UPT dan konversi predikat akreditasi.
-- Seed pohon indikator_node untuk IKA.01 dibuat terpisah (0003_seed_ika01.sql)
-- setelah kamus data leaf node selesai disusun.

insert into upt (kode, nama) values
  ('PPIC', 'Politeknik Penerbangan Indonesia Curug'),
  ('POLTEKBANG_SBY', 'Politeknik Penerbangan Surabaya'),
  ('POLTEKBANG_MDN', 'Politeknik Penerbangan Medan'),
  ('POLTEKBANG_MKS', 'Politeknik Penerbangan Makassar'),
  ('POLTEKBANG_PLB', 'Politeknik Penerbangan Palembang'),
  ('POLTEKBANG_JYP', 'Politeknik Penerbangan Jayapura'),
  ('API_BANYUWANGI', 'Akademi Penerbang Indonesia Banyuwangi'),
  ('BP3_CURUG', 'Balai Pendidikan dan Pelatihan Penerbangan Curug');
  -- Sesuaikan nama resmi 8 UPT ini dengan yang tertulis di BRD/Excel sebelum dipakai production.

insert into predikat_konversi (jenis, predikat, skor) values
  ('AKREDITASI', 'Unggul', 4),
  ('AKREDITASI', 'A', 3.5),
  ('AKREDITASI', 'Baik Sekali', 3),
  ('AKREDITASI', 'B', 2.5),
  ('AKREDITASI', 'Baik', 2),
  ('AKREDITASI', 'C', 1);

insert into periode (tahun, triwulan, status) values
  (2026, 1, 'TUTUP'),
  (2026, 2, 'BUKA'),
  (2026, 3, 'TUTUP'),
  (2026, 4, 'TUTUP');
