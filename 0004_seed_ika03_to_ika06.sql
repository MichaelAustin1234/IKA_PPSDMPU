-- 0004_seed_ika03_to_ika06.sql
-- Seed struktur pohon indikator untuk IKA.03, IKA.04, IKA.05, dan IKA.06
-- Mengacu pada kamus_data_leaf_node_ika.csv dan panduan AGENTS.md

do $$
declare
  -- IKA.03
  v_ska03_id uuid;
  v_ika03_id uuid;
  v_komp3_a_id uuid;
  v_komp3_b_id uuid;
  v_komp3_c_id uuid;
  v_komp3_d_id uuid;

  -- IKA.04
  v_ska04_id uuid;
  v_ika04_id uuid;
  v_komp4_a_id uuid;
  v_komp4_b_id uuid;
  v_b3_ref_id uuid;
  v_komp4_c_id uuid;
  v_c1_sarpras_id uuid;
  v_c2_layak_id uuid;
  v_komp4_d_id uuid;

  -- IKA.05
  v_ska05_id uuid;
  v_ika05_id uuid;

  -- IKA.06
  v_ska06_id uuid;
  v_ika06_id uuid;
  v_komp6_b_id uuid;
  v_sub6_b1_id uuid;
  v_sub6_b2_id uuid;
  v_sub6_b3_id uuid;
  v_komp6_d_id uuid;
  v_sub6_d1_id uuid;
  v_sub6_d2_id uuid;
  v_sub6_d3_id uuid;
  v_sub6_d4_id uuid;
  v_sub6_d5_id uuid;
  v_sub6_d6_id uuid;

begin
  -- =====================================================================
  -- 1. IKA.03: Indeks Kebijakan Pengembangan SDM Transportasi Udara
  -- =====================================================================
  insert into indikator_node (kode, nama, level, bobot, tipe_input, cap_100, urutan)
  values ('SKA.03', 'Terwujudnya Kebijakan Pengembangan SDM yang Menunjang Kebijakan Sektor Transportasi Udara', 'SKA', 1.0, 'TURUNAN', false, 3)
  returning id into v_ska03_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ska03_id, 'IKA.03', 'Indeks Kebijakan Pengembangan SDM Transportasi Udara', 'IKA', 1.0, 'TURUNAN', false, 0, 100, 3)
  returning id into v_ika03_id;

  -- Komponen 3.A (Keselarasan, Bobot 0.3)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika03_id, 'IKA.03.A', 'Tingkat Keselarasan Kebijakan Pengembangan SDM Transportasi Udara', 'KOMPONEN', 0.3, 'TURUNAN', false, 0, 100, 1)
  returning id into v_komp3_a_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_komp3_a_id, 'IKA.03.A.1', 'Jumlah Skor Aspek Kebijakan yang Selaras', 'LEAF', 0, 'ANGKA', false, 0, 1),
    (v_komp3_a_id, 'IKA.03.A.2', 'Jumlah Aspek Kebijakan', 'LEAF', 0, 'ANGKA', false, 0, 2);

  -- Komponen 3.B (Relevansi, Bobot 0.3)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika03_id, 'IKA.03.B', 'Tingkat Relevansi Kebijakan Pengembangan SDM Transportasi Udara', 'KOMPONEN', 0.3, 'TURUNAN', false, 0, 100, 2)
  returning id into v_komp3_b_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_komp3_b_id, 'IKA.03.B.1', 'Jumlah Skor Aspek Kebijakan yang Relevan', 'LEAF', 0, 'ANGKA', false, 0, 1),
    (v_komp3_b_id, 'IKA.03.B.2', 'Jumlah Aspek Kebijakan', 'LEAF', 0, 'ANGKA', false, 0, 2);

  -- Komponen 3.C (Efektivitas, Bobot 0.3) -> TURUNAN dari 4 komponen IKA.01
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan, catatan)
  values (v_ika03_id, 'IKA.03.C', 'Tingkat Efektivitas Kebijakan (Rata-rata 4 Skor IKA.01)', 'KOMPONEN', 0.3, 'TURUNAN', false, 0, 100, 3, 'Dihitung otomatis dari 4 komponen IKA.01 (A, B, C, D)')
  returning id into v_komp3_c_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan) values
    (v_komp3_c_id, 'IKA.03.C.1', 'Turunan Skor Kelulusan (IKA.01.A)', 'LEAF', 0.25, 'TURUNAN', false, 0, 100, 1),
    (v_komp3_c_id, 'IKA.03.C.2', 'Turunan Skor Sertifikasi (IKA.01.B)', 'LEAF', 0.25, 'TURUNAN', false, 0, 100, 2),
    (v_komp3_c_id, 'IKA.03.C.3', 'Turunan Skor Penyerapan (IKA.01.C)', 'LEAF', 0.25, 'TURUNAN', false, 0, 100, 3),
    (v_komp3_c_id, 'IKA.03.C.4', 'Turunan Skor Kepuasan (IKA.01.D)', 'LEAF', 0.25, 'TURUNAN', false, 0, 100, 4);

  -- Komponen 3.D (Keterlibatan Industri, Bobot 0.1)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika03_id, 'IKA.03.D', 'Tingkat Keterlibatan Industri dalam Perumusan Kebijakan', 'KOMPONEN', 0.1, 'TURUNAN', false, 0, 100, 4)
  returning id into v_komp3_d_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_komp3_d_id, 'IKA.03.D.1', 'Jumlah Bentuk Keterlibatan Industri yang Terjalin', 'LEAF', 0, 'ANGKA', false, 0, 1),
    (v_komp3_d_id, 'IKA.03.D.2', 'Jumlah Bentuk Keterlibatan Industri yang Mungkin Terjalin', 'LEAF', 0, 'ANGKA', false, 0, 2);

  -- =====================================================================
  -- 2. IKA.04: Indeks Kualitas Layanan Diklat SDM Transportasi Udara
  -- =====================================================================
  insert into indikator_node (kode, nama, level, bobot, tipe_input, cap_100, urutan)
  values ('SKA.04', 'Meningkatnya Kualitas Pelayanan, Pengembangan, Pendidikan dan Pelatihan Transportasi Udara', 'SKA', 1.0, 'TURUNAN', false, 4)
  returning id into v_ska04_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ska04_id, 'IKA.04', 'Indeks Kualitas Layanan Pendidikan dan Pelatihan SDM', 'IKA', 1.0, 'TURUNAN', false, 0, 100, 4)
  returning id into v_ika04_id;

  -- 4.A: Kepuasan Peserta Didik (Bobot 0.25)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika04_id, 'IKA.04.A', 'Tingkat Kepuasan Peserta Didik terhadap Layanan Diklat', 'KOMPONEN', 0.25, 'TURUNAN', false, 0, 100, 1)
  returning id into v_komp4_a_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_komp4_a_id, 'IKA.04.A.1', 'Rata-Rata Skor Kepuasan Peserta Didik', 'LEAF', 0, 'ANGKA', false, 0, 1),
    (v_komp4_a_id, 'IKA.04.A.2', 'Jumlah Responden Peserta Didik', 'LEAF', 0, 'ANGKA', false, 0, 2);

  -- 4.B: Sertifikasi Tenaga Pendidik (Bobot 0.25)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika04_id, 'IKA.04.B', 'Tingkat Sertifikasi Tenaga Pendidik', 'KOMPONEN', 0.25, 'TURUNAN', false, 0, 100, 2)
  returning id into v_komp4_b_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan)
  values (v_komp4_b_id, 'IKA.04.B.3', 'Jumlah Dosen / Instruktur', 'LEAF', 0, 'ANGKA', false, 0, 3)
  returning id into v_b3_ref_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_ref_node_id, max_persen, urutan) values
    (v_komp4_b_id, 'IKA.04.B.1', 'Jumlah Dosen dan Instruktur Berkualifikasi (95%)', 'LEAF', 0.5, 'ANGKA', false, 0, v_b3_ref_id, 0.95, 1),
    (v_komp4_b_id, 'IKA.04.B.2', 'Jumlah Dosen dan Instruktur Tersertifikasi (85%)', 'LEAF', 0.5, 'ANGKA', false, 0, v_b3_ref_id, 0.85, 2);

  -- 4.C: Sarana dan Prasarana (Bobot 0.25)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika04_id, 'IKA.04.C', 'Tingkat Ketersediaan dan Kelayakan Sarana Prasarana', 'KOMPONEN', 0.25, 'TURUNAN', false, 0, 100, 3)
  returning id into v_komp4_c_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, urutan) values
    (v_komp4_c_id, 'IKA.04.C.1.1', 'Jumlah Fasilitas Utama Pembelajaran', 'LEAF', 0, 'ANGKA', false, 0, 1),
    (v_komp4_c_id, 'IKA.04.C.1.2', 'Jumlah Fasilitas Penunjang Pembelajaran', 'LEAF', 0, 'ANGKA', false, 0, 2),
    (v_komp4_c_id, 'IKA.04.C.2.1', 'Jumlah Fasilitas Utama yang Layak', 'LEAF', 0, 'ANGKA', false, 0, 3),
    (v_komp4_c_id, 'IKA.04.C.2.2', 'Jumlah Fasilitas Penunjang yang Layak', 'LEAF', 0, 'ANGKA', false, 0, 4);

  -- 4.D: Standar Mutu (Bobot 0.25)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika04_id, 'IKA.04.D', 'Persentase Penerapan Standar Mutu di UPT Matra Udara', 'KOMPONEN', 0.25, 'TURUNAN', false, 0, 100, 4)
  returning id into v_komp4_d_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan) values
    (v_komp4_d_id, 'IKA.04.D.1', 'Penerapan Standar Mutu ISO 9001', 'LEAF', 0.25, 'ANGKA', false, 0, 9, 1),
    (v_komp4_d_id, 'IKA.04.D.2', 'Kepatuhan Standar Nasional Diklat Transportasi Udara', 'LEAF', 0.25, 'ANGKA', false, 0, 18, 2),
    (v_komp4_d_id, 'IKA.04.D.3', 'Pelaksanaan Audit Internal dan Eksternal Berkala', 'LEAF', 0.25, 'ANGKA', false, 0, 9, 3),
    (v_komp4_d_id, 'IKA.04.D.4', 'Efektivitas Tindakan Perbaikan dan Pencegahan (CAPA)', 'LEAF', 0.25, 'ANGKA', false, 0, 9, 4);

  -- =====================================================================
  -- 3. IKA.05: Indeks Profesionalisme ASN
  -- =====================================================================
  insert into indikator_node (kode, nama, level, bobot, tipe_input, cap_100, urutan)
  values ('SKA.05', 'Terwujudnya Organisasi yang Agile dan SDM Unggul di Bidang Transportasi Udara', 'SKA', 1.0, 'TURUNAN', false, 5)
  returning id into v_ska05_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan, catatan)
  values (v_ska05_id, 'IKA.05', 'Indeks Profesionalisme ASN', 'IKA', 1.0, 'ANGKA', false, 0, 100, 5, 'Rata-rata 9 unit, diinput langsung per UPT')
  returning id into v_ika05_id;

  -- =====================================================================
  -- 4. IKA.06: Indeks Akuntabilitas
  -- =====================================================================
  insert into indikator_node (kode, nama, level, bobot, tipe_input, cap_100, urutan)
  values ('SKA.06', 'Terwujudnya Birokrasi yang Akuntabel dan Berorientasi pada Layanan Prima', 'SKA', 1.0, 'TURUNAN', false, 6)
  returning id into v_ska06_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ska06_id, 'IKA.06', 'Indeks Akuntabilitas PPSDMPU / UPT', 'IKA', 1.0, 'TURUNAN', false, 0, 100, 6)
  returning id into v_ika06_id;

  -- 6.A: SAKIP (Bobot 0.25)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika06_id, 'IKA.06.A', 'Nilai SAKIP UPT', 'LEAF', 0.25, 'ANGKA', false, 0, 100, 1);

  -- 6.B: IKPA (Bobot 0.25)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika06_id, 'IKA.06.B', 'Nilai Indeks Kinerja Pengelolaan Anggaran (IKPA)', 'KOMPONEN', 0.25, 'TURUNAN', false, 0, 100, 2)
  returning id into v_komp6_b_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp6_b_id, 'IKA.06.B.1', 'Kualitas Perencanaan Anggaran', 'SUB', 0.25, 'TURUNAN', false, 0, 25, 1)
  returning id into v_sub6_b1_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan) values
    (v_sub6_b1_id, 'IKA.06.B.1.1', 'Revisi DIPA', 'LEAF', 0.4, 'ANGKA', false, 0, 100, 1),
    (v_sub6_b1_id, 'IKA.06.B.1.2', 'Deviasi Halaman III DIPA', 'LEAF', 0.6, 'ANGKA', false, 0, 100, 2);

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp6_b_id, 'IKA.06.B.2', 'Kualitas Pelaksanaan Anggaran', 'SUB', 0.50, 'TURUNAN', false, 0, 50, 2)
  returning id into v_sub6_b2_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan) values
    (v_sub6_b2_id, 'IKA.06.B.2.1', 'Penyerapan Anggaran', 'LEAF', 0.4, 'ANGKA', false, 0, 100, 1),
    (v_sub6_b2_id, 'IKA.06.B.2.2', 'Belanja Kontraktual', 'LEAF', 0.2, 'ANGKA', false, 0, 100, 2),
    (v_sub6_b2_id, 'IKA.06.B.2.3', 'Penyelesaian Tagihan', 'LEAF', 0.2, 'ANGKA', false, 0, 100, 3),
    (v_sub6_b2_id, 'IKA.06.B.2.4', 'Pengelolaan UP dan TUP', 'LEAF', 0.2, 'ANGKA', false, 0, 100, 4);

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_komp6_b_id, 'IKA.06.B.3', 'Kualitas Hasil Pelaksanaan Anggaran', 'SUB', 0.25, 'TURUNAN', false, 0, 25, 3)
  returning id into v_sub6_b3_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_sub6_b3_id, 'IKA.06.B.3.1', 'Capaian Output', 'LEAF', 1.0, 'ANGKA', false, 0, 100, 1);

  -- 6.C: Kearsipan (Bobot 0.25)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika06_id, 'IKA.06.C', 'Nilai Indeks Kearsipan UPT', 'LEAF', 0.25, 'ANGKA', false, 0, 100, 3);

  -- 6.D: Maturitas BLU (Bobot 0.25)
  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan)
  values (v_ika06_id, 'IKA.06.D', 'Nilai Indeks Maturitas BLU UPT', 'KOMPONEN', 0.25, 'TURUNAN', false, 0, 5, 4)
  returning id into v_komp6_d_id;

  insert into indikator_node (parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, urutan) values
    (v_komp6_d_id, 'IKA.06.D.1', 'Aspek Keuangan (20%)', 'LEAF', 0.20, 'ANGKA', false, 0, 5, 1),
    (v_komp6_d_id, 'IKA.06.D.2', 'Aspek Pelayanan / Operasional (25%)', 'LEAF', 0.25, 'ANGKA', false, 0, 5, 2),
    (v_komp6_d_id, 'IKA.06.D.3', 'Aspek Kapabilitas Internal (20%)', 'LEAF', 0.20, 'ANGKA', false, 0, 5, 3),
    (v_komp6_d_id, 'IKA.06.D.4', 'Aspek Tata Kelola dan Kepemimpinan (20%)', 'LEAF', 0.20, 'ANGKA', false, 0, 5, 4),
    (v_komp6_d_id, 'IKA.06.D.5', 'Aspek Inovasi (10%)', 'LEAF', 0.10, 'ANGKA', false, 0, 5, 5),
    (v_komp6_d_id, 'IKA.06.D.6', 'Aspek Lingkungan (5%)', 'LEAF', 0.05, 'ANGKA', false, 0, 5, 6);

  -- =====================================================================
  -- Hubungkan ke semua 8 UPT di node_upt
  -- =====================================================================
  insert into node_upt (node_id, upt_id, berlaku)
  select n.id, u.id, true
  from indikator_node n
  cross join upt u
  where n.kode like 'IKA.03%' 
     or n.kode like 'IKA.04%' 
     or n.kode like 'IKA.05%' 
     or n.kode like 'IKA.06%'
     or n.kode in ('SKA.03','SKA.04','SKA.05','SKA.06')
  on conflict (node_id, upt_id) do nothing;

end $$;
