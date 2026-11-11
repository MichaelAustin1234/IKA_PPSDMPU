-- 0003_seed_ika01.sql
-- Seed struktur pohon indikator untuk IKA.01 (Indeks Kompetensi SDM Transportasi Udara)
-- Sesuai kamus_data_leaf_node_ika.csv dan panduan AGENTS.md

do $$
declare
  v_ska_id uuid;
  v_ika01_id uuid;
  v_komp_a_id uuid;
  v_sub_a1_id uuid;
  v_sub_a2_id uuid;
  v_komp_b_id uuid;
  v_sub_b1_id uuid;
  v_sub_b11_id uuid;
  v_sub_b12_id uuid;
  v_sub_b2_id uuid;
  v_sub_b21_id uuid;
  v_sub_b22_id uuid;
  v_sub_b23_id uuid;
  v_komp_c_id uuid;
  v_c6_ref_id uuid;
  v_komp_d_id uuid;
begin
  -- 0. Sasaran Strategis (SKA)
  insert into indikator_node (kode, nama, level, bobot, tipe_input, cap_100, urutan)
  values ('SKA.01', 'Meningkatkan kualitas pendidikan dan pelatihan SDM transportasi udara', 'SKA', 1.0, 'TURUNAN', false, 1)
  returning id into v_ska_id;

  -- 1. IKA.01 (Top-level Indikator)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ska_id, 'IKA.01', 'Indeks Kompetensi SDM Transportasi Udara', 'IKA', 1.0, 'TURUNAN', true, 0, 100, 1)
  returning id into v_ika01_id;

  -- =====================================================================
  -- KOMPONEN A: Tingkat Kelulusan (Bobot 0.2)
  -- =====================================================================
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika01_id, 'A', 'Tingkat Kelulusan', 'KOMPONEN', 0.2, 'TURUNAN', true, 0, 100, 1)
  returning id into v_komp_a_id;

  -- Sub A.1: Persentase Lulusan Tepat Waktu (Bobot 0.6)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp_a_id, 'A.1', 'Persentase Lulusan Tepat Waktu', 'SUB', 0.6, 'TURUNAN', true, 0, 100, 1)
  returning id into v_sub_a1_id;

  -- Sub A.2: Persentase Lulusan dengan IPK >= 3,0 (Bobot 0.4)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp_a_id, 'A.2', 'Persentase Lulusan dengan IPK >= 3,0', 'SUB', 0.4, 'TURUNAN', true, 80, 100, 2)
  returning id into v_sub_a2_id;

  -- Leaf Data Komponen A
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_komp_a_id, 'A_LULUS', 'Jumlah Lulusan', 'LEAF', 0, 'ANGKA', true, 0, 1),
    (v_sub_a1_id, 'A_TEPAT', 'Jumlah Lulusan Tepat Waktu', 'LEAF', 0, 'ANGKA', true, 0, 2),
    (v_sub_a2_id, 'A_IPK_35', 'Jumlah Lulusan dengan IPK >= 3,5 - 4,0', 'LEAF', 0, 'ANGKA', true, 0, 3),
    (v_sub_a2_id, 'A_IPK_30', 'Jumlah Lulusan dengan IPK >= 3,0 dan IPK < 3,5', 'LEAF', 0, 'ANGKA', true, 0, 4),
    (v_sub_a2_id, 'A_IPK_275', 'Jumlah Lulusan dengan IPK >= 2,75 dan IPK < 3', 'LEAF', 0, 'ANGKA', true, 0, 5),
    (v_sub_a2_id, 'A_IPK_KURANG', 'Jumlah Lulusan dengan IPK < 2,75', 'LEAF', 0, 'ANGKA', true, 0, 6);

  -- =====================================================================
  -- KOMPONEN B: Tingkat Pencapaian Sertifikasi Kompetensi (Bobot 0.2)
  -- =====================================================================
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan, catatan)
  values (v_ika01_id, 'B', 'Tingkat Pencapaian Sertifikasi Kompetensi', 'KOMPONEN', 0.2, 'ANGKA', true, 0, 100, 2, 'Nilai diinput manual pada Excel sumber — didukung sub B.1 dan B.2')
  returning id into v_komp_b_id;

  -- Sub B.1: Pendidikan (Bobot 0.3)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp_b_id, 'B.1', 'Tingkat Lulusan Pendidikan dengan Sertifikasi Kompetensi', 'SUB', 0.3, 'TURUNAN', true, 0, 100, 1)
  returning id into v_sub_b1_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_sub_b1_id, 'B.1.1', 'Persentase Lulusan Pendidikan Tersertifikasi Kompetensi Nasional', 'SUB', 0.8, 'TURUNAN', true, 0, 95, 1)
  returning id into v_sub_b11_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_sub_b1_id, 'B.1.2', 'Persentase Lulusan Pendidikan Tersertifikasi Kompetensi Internasional', 'SUB', 0.2, 'TURUNAN', true, 0, 5, 2)
  returning id into v_sub_b12_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_sub_b11_id, 'B1_NASIONAL', 'Jumlah lulusan pendidikan yang memiliki sertifikat kompetensi berstandar nasional', 'LEAF', 0, 'ANGKA', true, 0, 1),
    (v_sub_b12_id, 'B1_INTERNASIONAL', 'Jumlah lulusan pendidikan yang memiliki sertifikat kompetensi berstandar internasional (Approval Internasional)', 'LEAF', 0, 'ANGKA', true, 0, 2);

  -- Sub B.2: Pelatihan (Bobot 0.7)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp_b_id, 'B.2', 'Tingkat Lulusan Pelatihan dengan Sertifikasi Kompetensi', 'SUB', 0.7, 'TURUNAN', true, 0, 100, 2)
  returning id into v_sub_b2_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_sub_b2_id, 'B.2.1', 'Persentase Lulusan Pelatihan Teknis Tersertifikasi Nasional', 'SUB', 0.2, 'TURUNAN', true, 0, 20, 1)
  returning id into v_sub_b21_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_sub_b2_id, 'B.2.2', 'Persentase Lulusan Pelatihan Teknis Tersertifikasi Internasional', 'SUB', 0.1, 'TURUNAN', true, 0, 10, 2)
  returning id into v_sub_b22_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_sub_b2_id, 'B.2.3', 'Persentase Lulusan Pelatihan Teknis', 'SUB', 0.7, 'TURUNAN', true, 0, 70, 3)
  returning id into v_sub_b23_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_sub_b2_id, 'B2_PESERTA', 'Jumlah Peserta Pelatihan', 'LEAF', 0, 'ANGKA', true, 0, 1),
    (v_sub_b21_id, 'B2_LULUS_NAS', 'Jumlah Lulusan Pelatihan Teknis Tersertifikasi Nasional (BNSP / DJU)', 'LEAF', 0, 'ANGKA', true, 0, 2),
    (v_sub_b22_id, 'B2_LULUS_INT', 'Jumlah Lulusan Pelatihan Teknis Tersertifikasi Internasional', 'LEAF', 0, 'ANGKA', true, 0, 3),
    (v_sub_b23_id, 'B2_LULUS_NON', 'Jumlah Lulusan Pelatihan Teknis Non-Sertifikasi', 'LEAF', 0, 'ANGKA', true, 0, 4);

  -- =====================================================================
  -- KOMPONEN C: Tingkat Penyerapan Lulusan (Bobot 0.3)
  -- =====================================================================
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan, catatan)
  values (v_ika01_id, 'C', 'Tingkat Penyerapan Lulusan', 'KOMPONEN', 0.3, 'TURUNAN', true, 0, 100, 3, 'Jika C.1 >= 100 maka C dikunci = 100')
  returning id into v_komp_c_id;

  -- C.6 sebagai node acuan batas dinamis
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan)
  values (v_komp_c_id, 'C.6', 'Jumlah lulusan sampai dengan tahun t', 'LEAF', 0, 'ANGKA', true, 0, 6)
  returning id into v_c6_ref_id;

  -- C.1 s.d C.5 (Bobot: 0.8 + 0.16 + 0.024 + 0.016 + 0 = 1.0)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_ref_node_id, max_persen, urutan) values
    (v_komp_c_id, 'C.1', 'Jumlah Lulusan Bekerja <= 6 bulan (75%)', 'LEAF', 0.800, 'ANGKA', true, 0, v_c6_ref_id, 0.75, 1),
    (v_komp_c_id, 'C.2', 'Jumlah Lulusan Bekerja > 6 bulan s.d 12 bulan (20%)', 'LEAF', 0.160, 'ANGKA', true, 0, v_c6_ref_id, 0.20, 2),
    (v_komp_c_id, 'C.3', 'Jumlah Lulusan Bekerja > 12 bulan s.d 18 bulan (3%)', 'LEAF', 0.024, 'ANGKA', true, 0, v_c6_ref_id, 0.03, 3),
    (v_komp_c_id, 'C.4', 'Jumlah Lulusan Bekerja > 18 bulan s.d 24 bulan (2%)', 'LEAF', 0.016, 'ANGKA', true, 0, v_c6_ref_id, 0.02, 4),
    (v_komp_c_id, 'C.5', 'Jumlah Lulusan Bekerja > 24 bulan atau belum bekerja (0%)', 'LEAF', 0.000, 'ANGKA', true, 0, null, null, 5);

  -- =====================================================================
  -- KOMPONEN D: Tingkat Kepuasan Pengguna Lulusan (Bobot 0.3)
  -- =====================================================================
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika01_id, 'D', 'Tingkat Kepuasan Pengguna Lulusan', 'KOMPONEN', 0.3, 'TURUNAN', true, 0, 100, 4)
  returning id into v_komp_d_id;

  -- D.1 s.d D.3 (Bobot: 0.4 + 0.3 + 0.3 = 1.0, Skala 0 s.d 4)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan) values
    (v_komp_d_id, 'D.1', 'Aspek Kompetensi', 'LEAF', 0.4, 'ANGKA', true, 0, 4, 1),
    (v_komp_d_id, 'D.2', 'Aspek Kinerja', 'LEAF', 0.3, 'ANGKA', true, 0, 4, 2),
    (v_komp_d_id, 'D.3', 'Aspek Etos Kerja', 'LEAF', 0.3, 'ANGKA', true, 0, 4, 3);

  -- =====================================================================
  -- Inisialisasi node_upt (berlaku untuk semua 8 UPT)
  -- =====================================================================
  insert into node_upt (node_id, upt_id, berlaku)
  select n.id, u.id, true
  from indikator_node n
  cross join upt u
  where n.kode like 'IKA.01%' or n.kode in ('A','B','C','D') or n.parent_id is not null;

end $$;
