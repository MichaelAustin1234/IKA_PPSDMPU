-- 0005_seed_ika02.sql
-- Seed struktur pohon indikator untuk IKA.02 (Indeks Akreditasi dan Sertifikasi Lembaga Diklat)
-- Mengacu pada kamus_data_leaf_node_ika.csv dan panduan AGENTS.md §2.6 (Opsi B: Replika formula Excel sumber)

do $$
declare
  v_ska02_id uuid;
  v_ika02_id uuid;
  v_komp2_a_id uuid;
  v_komp2_b_id uuid;
  v_sub_b1_id uuid;
  v_sub_b2_id uuid;
  v_sub_b3_id uuid;
  v_sub_b4_id uuid;
  v_sub_b5_id uuid;
  v_sub_b6_id uuid;
  v_sub_b7_id uuid;
  v_komp2_c_id uuid;
  v_komp2_d_id uuid;
begin
  -- SKA.02
  insert into indikator_node (kode, nama, level, bobot, tipe_input, cap_100, urutan)
  values ('SKA.02', 'Meningkatnya Akreditasi Lembaga Pendidikan Vokasi, Sertifikasi Pelatihan dan Tenaga Kerja Sektor Transportasi Udara', 'SKA', 1.0, 'TURUNAN', false, 2)
  returning id into v_ska02_id;

  -- IKA.02
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ska02_id, 'IKA.02', 'Indeks Akreditasi dan Sertifikasi Lembaga Pendidikan dan Pelatihan', 'IKA', 1.0, 'TURUNAN', false, 0, 100, 2)
  returning id into v_ika02_id;

  -- =====================================================================
  -- KOMPONEN 2.A: Tingkat Akreditasi Institusi (Bobot 0.3)
  -- Catatan: Excel menggunakan IF(rata-rata < 3, rata-rata + 1) tanpa ELSE (Opsi B)
  -- =====================================================================
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan, catatan)
  values (v_ika02_id, 'IKA.02.A', 'Tingkat Akreditasi Institusi', 'KOMPONEN', 0.3, 'TURUNAN', false, 0, 4, 1, 'Formula Excel sumber Opsi B: IF(rata-rata < 3, rata-rata + 1, 0)')
  returning id into v_komp2_a_id;

  -- 7 UPT Pendidikan
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan) values
    (v_komp2_a_id, 'IKA.02.A.1', 'Akreditasi Institusi PPI Curug', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 0, 4, 1),
    (v_komp2_a_id, 'IKA.02.A.2', 'Akreditasi Institusi Poltekbang Surabaya', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 0, 4, 2),
    (v_komp2_a_id, 'IKA.02.A.3', 'Akreditasi Institusi Poltekbang Medan', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 0, 4, 3),
    (v_komp2_a_id, 'IKA.02.A.4', 'Akreditasi Institusi Poltekbang Makassar', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 0, 4, 4),
    (v_komp2_a_id, 'IKA.02.A.5', 'Akreditasi Institusi Poltekbang Palembang', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 0, 4, 5),
    (v_komp2_a_id, 'IKA.02.A.6', 'Akreditasi Institusi Poltekbang Jayapura', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 0, 4, 6),
    (v_komp2_a_id, 'IKA.02.A.7', 'Akreditasi Institusi API Banyuwangi', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 0, 4, 7);

  -- =====================================================================
  -- KOMPONEN 2.B: Tingkat Akreditasi Program Studi (Bobot 0.3)
  -- Catatan: Excel menggunakan IF(rata-rata < 3.5, rata-rata + 0.5) tanpa ELSE (Opsi B)
  -- =====================================================================
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan, catatan)
  values (v_ika02_id, 'IKA.02.B', 'Tingkat Akreditasi Program Studi', 'KOMPONEN', 0.3, 'TURUNAN', false, 0, 100, 2, 'Formula Excel sumber Opsi B: IF(rata-rata < 3.5, rata-rata + 0.5, 0)')
  returning id into v_komp2_b_id;

  -- B.1: PPI Curug (10 prodi)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp2_b_id, 'IKA.02.B.1', 'Akreditasi Prodi PPI Curug', 'SUB', 1.0/7.0, 'TURUNAN', false, 0, 4, 1)
  returning id into v_sub_b1_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, urutan) values
    (v_sub_b1_id, 'IKA.02.B.1.1', 'D-III Teknik Mekanikal Bandara', 'LEAF', 0.1, 'PREDIKAT', false, 1),
    (v_sub_b1_id, 'IKA.02.B.1.2', 'D-III Teknik Bangunan dan Landasan', 'LEAF', 0.1, 'PREDIKAT', false, 2),
    (v_sub_b1_id, 'IKA.02.B.1.3', 'D-III Penerangan Aeronautika', 'LEAF', 0.1, 'PREDIKAT', false, 3),
    (v_sub_b1_id, 'IKA.02.B.1.4', 'D-III Pertolongan Kecelakaan Pesawat', 'LEAF', 0.1, 'PREDIKAT', false, 4),
    (v_sub_b1_id, 'IKA.02.B.1.5', 'D-III Operasi Bandar Udara', 'LEAF', 0.1, 'PREDIKAT', false, 5),
    (v_sub_b1_id, 'IKA.02.B.1.6', 'D-IV Lalu Lintas Udara', 'LEAF', 0.1, 'PREDIKAT', false, 6),
    (v_sub_b1_id, 'IKA.02.B.1.7', 'D-IV Penerbang', 'LEAF', 0.1, 'PREDIKAT', false, 7),
    (v_sub_b1_id, 'IKA.02.B.1.8', 'D-IV Teknik Listrik Bandara', 'LEAF', 0.1, 'PREDIKAT', false, 8),
    (v_sub_b1_id, 'IKA.02.B.1.9', 'D-IV Teknik Pesawat Udara', 'LEAF', 0.1, 'PREDIKAT', false, 9),
    (v_sub_b1_id, 'IKA.02.B.1.10', 'D-IV Teknik Navigasi Udara', 'LEAF', 0.1, 'PREDIKAT', false, 10);

  -- B.2: Poltekbang Surabaya (7 prodi)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp2_b_id, 'IKA.02.B.2', 'Akreditasi Prodi Poltekbang Surabaya', 'SUB', 1.0/7.0, 'TURUNAN', false, 0, 4, 2)
  returning id into v_sub_b2_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, urutan) values
    (v_sub_b2_id, 'IKA.02.B.2.1', 'D-III Komunikasi Penerbangan', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 1),
    (v_sub_b2_id, 'IKA.02.B.2.2', 'D-III Lalu Lintas Udara', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 2),
    (v_sub_b2_id, 'IKA.02.B.2.3', 'D-III Manajemen Transportasi Udara', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 3),
    (v_sub_b2_id, 'IKA.02.B.2.4', 'D-III Teknik Bangunan dan Landasan', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 4),
    (v_sub_b2_id, 'IKA.02.B.2.5', 'D-III Teknik Listrik Bandara', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 5),
    (v_sub_b2_id, 'IKA.02.B.2.6', 'D-III Teknik Navigasi Udara', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 6),
    (v_sub_b2_id, 'IKA.02.B.2.7', 'D-III Teknik Pesawat Udara', 'LEAF', 1.0/7.0, 'PREDIKAT', false, 7);

  -- B.3: Poltekbang Medan (4 prodi)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp2_b_id, 'IKA.02.B.3', 'Akreditasi Prodi Poltekbang Medan', 'SUB', 1.0/7.0, 'TURUNAN', false, 0, 4, 3)
  returning id into v_sub_b3_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, urutan) values
    (v_sub_b3_id, 'IKA.02.B.3.1', 'D-III Pemanduan Lalu Lintas Udara', 'LEAF', 0.25, 'PREDIKAT', false, 1),
    (v_sub_b3_id, 'IKA.02.B.3.2', 'D-III Teknik Telekomunikasi dan Navigasi Udara', 'LEAF', 0.25, 'PREDIKAT', false, 2),
    (v_sub_b3_id, 'IKA.02.B.3.3', 'D-III Teknik Listrik Bandara', 'LEAF', 0.25, 'PREDIKAT', false, 3),
    (v_sub_b3_id, 'IKA.02.B.3.4', 'D-III Teknologi Pemeliharaan Pesawat Udara', 'LEAF', 0.25, 'PREDIKAT', false, 4);

  -- B.4: Poltekbang Makassar (4 prodi)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp2_b_id, 'IKA.02.B.4', 'Akreditasi Prodi Poltekbang Makassar', 'SUB', 1.0/7.0, 'TURUNAN', false, 0, 4, 4)
  returning id into v_sub_b4_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, urutan) values
    (v_sub_b4_id, 'IKA.02.B.4.1', 'D-III Manajemen Lalu Lintas Udara', 'LEAF', 0.25, 'PREDIKAT', false, 1),
    (v_sub_b4_id, 'IKA.02.B.4.2', 'D-III Teknologi Navigasi Udara', 'LEAF', 0.25, 'PREDIKAT', false, 2),
    (v_sub_b4_id, 'IKA.02.B.4.3', 'D-III Teknologi Bandar Udara', 'LEAF', 0.25, 'PREDIKAT', false, 3),
    (v_sub_b4_id, 'IKA.02.B.4.4', 'D-III Teknologi Pemeliharaan Pesawat Udara', 'LEAF', 0.25, 'PREDIKAT', false, 4);

  -- B.5: Poltekbang Palembang (3 prodi)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp2_b_id, 'IKA.02.B.5', 'Akreditasi Prodi Poltekbang Palembang', 'SUB', 1.0/7.0, 'TURUNAN', false, 0, 4, 5)
  returning id into v_sub_b5_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, urutan) values
    (v_sub_b5_id, 'IKA.02.B.5.1', 'D-III Manajemen Bandar Udara', 'LEAF', 1.0/3.0, 'PREDIKAT', false, 1),
    (v_sub_b5_id, 'IKA.02.B.5.2', 'D-III Penyelamatan dan Pemadam Kebakaran Penerbangan', 'LEAF', 1.0/3.0, 'PREDIKAT', false, 2),
    (v_sub_b5_id, 'IKA.02.B.5.3', 'D-IV Teknologi Rekayasa Bandar Udara', 'LEAF', 1.0/3.0, 'PREDIKAT', false, 3);

  -- B.6: Poltekbang Jayapura (3 prodi)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp2_b_id, 'IKA.02.B.6', 'Akreditasi Prodi Poltekbang Jayapura', 'SUB', 1.0/7.0, 'TURUNAN', false, 0, 4, 6)
  returning id into v_sub_b6_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, urutan) values
    (v_sub_b6_id, 'IKA.02.B.6.1', 'D-III Manajemen Lalu Lintas Udara', 'LEAF', 1.0/3.0, 'PREDIKAT', false, 1),
    (v_sub_b6_id, 'IKA.02.B.6.2', 'D-III Manajemen Bandar Udara', 'LEAF', 1.0/3.0, 'PREDIKAT', false, 2),
    (v_sub_b6_id, 'IKA.02.B.6.3', 'D-III Teknik Listrik Bandara', 'LEAF', 1.0/3.0, 'PREDIKAT', false, 3);

  -- B.7: API Banyuwangi (2 prodi)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp2_b_id, 'IKA.02.B.7', 'Akreditasi Prodi API Banyuwangi', 'SUB', 1.0/7.0, 'TURUNAN', false, 0, 4, 7)
  returning id into v_sub_b7_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, urutan) values
    (v_sub_b7_id, 'IKA.02.B.7.1', 'D-III Operasi Pesawat Udara', 'LEAF', 0.5, 'PREDIKAT', false, 1),
    (v_sub_b7_id, 'IKA.02.B.7.2', 'D-III Penerbang Sayap Tetap', 'LEAF', 0.5, 'PREDIKAT', false, 2);

  -- =====================================================================
  -- KOMPONEN 2.C: Tingkat Sertifikasi Program Pelatihan (Bobot 0.2)
  -- =====================================================================
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika02_id, 'IKA.02.C', 'Tingkat Sertifikasi Program Pelatihan', 'KOMPONEN', 0.2, 'TURUNAN', false, 0, 85, 3)
  returning id into v_komp2_c_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_komp2_c_id, 'IKA.02.C.1', 'Jumlah Program Pelatihan Tersertifikasi (Approval Ditjen Hubud / Internasional)', 'LEAF', 0, 'ANGKA', false, 0, 1),
    (v_komp2_c_id, 'IKA.02.C.2', 'Total Program Pelatihan', 'LEAF', 0, 'ANGKA', false, 0, 2);

  -- =====================================================================
  -- KOMPONEN 2.D: Tingkat Sertifikasi Tenaga Kerja (Bobot 0.2)
  -- =====================================================================
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan, catatan)
  values (v_ika02_id, 'IKA.02.D', 'Tingkat Sertifikasi Tenaga Kerja', 'KOMPONEN', 0.2, 'TURUNAN', false, 0, 85, 4, 'Bobot 0.2 sesuai kolom G Excel (label tertulis 0.30 adalah typo label Excel)')
  returning id into v_komp2_d_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_komp2_d_id, 'IKA.02.D.1.1', 'Jumlah Lulusan Pelatihan dengan Status Pekerja (non-alumni)', 'LEAF', 0, 'ANGKA', false, 0, 1),
    (v_komp2_d_id, 'IKA.02.D.1.2', 'Jumlah Serapan Lulusan Tersertifikasi', 'LEAF', 0, 'ANGKA', false, 0, 2),
    (v_komp2_d_id, 'IKA.02.D.2', 'Jumlah Serapan Lulusan dan Peserta Pelatihan Tersertifikasi', 'LEAF', 0, 'ANGKA', false, 0, 3);

  -- =====================================================================
  -- Hubungkan ke semua 8 UPT di node_upt
  -- =====================================================================
  insert into node_upt (node_id, upt_id, berlaku)
  select n.id, u.id, true
  from indikator_node n
  cross join upt u
  where n.kode like 'IKA.02%' or n.kode = 'SKA.02'
  on conflict (node_id, upt_id) do nothing;

end $$;
