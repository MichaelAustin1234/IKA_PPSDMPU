-- ============================================================================
-- MIGRATION: UPDATE LABEL BERSIH & SIMPAN METADATA TURUNAN IKA.03.C
-- Sistem Informasi Capaian Kinerja Antara (IKA) PPSDMPU
--
-- Aturan yang disepakati:
-- 1. Menyimpan metadata sumber turunan di kolom 'catatan' untuk IKA.03.C.1 - C.4
-- 2. Menghapus akhiran bobot seperti "(Bobot = 0,3)"
-- 3. Mempertahankan label DB yang disetujui (Pengecualian: IKA.03.B.1, IKA.04.A.2, IKA.04.C.1.1, C.1.2, C.2.1, C.2.2)
-- 4. Mengoreksi IKA.04.A.1 menjadi "Jumlah Skor Kepuasan Peserta Didik"
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. IKA.03: SIMPAN METADATA TURUNAN & PERBARUI LABEL
-- ----------------------------------------------------------------------------
UPDATE public.indikator_node 
SET nama = 'Tingkat Keselarasan Kebijakan Pengembangan SDM Transportasi Udara'
WHERE kode = 'IKA.03.A' AND level = 'KOMPONEN';

UPDATE public.indikator_node 
SET nama = 'Jumlah Skor Aspek Kebijakan Pengembangan SDM Transportasi Udara yang selaras dengan Kebijakan Sektor Transportasi Udara'
WHERE kode = 'IKA.03.A.1' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Tingkat Relevansi Kebijakan Pengembangan SDM Transportasi Udara'
WHERE kode = 'IKA.03.B' AND level = 'KOMPONEN';

-- IKA.03.B.1 TETAP: 'Jumlah Skor Aspek Kebijakan yang Relevan' (Pengecualian Disetujui)

UPDATE public.indikator_node 
SET nama = 'Tingkat Efektivitas Kebijakan Pengembangan SDM Transportasi Udara'
WHERE kode = 'IKA.03.C' AND level = 'KOMPONEN';

-- Simpan metadata referensi asal rumus ke kolom catatan sebelum nama dibersihkan
UPDATE public.indikator_node 
SET 
  nama = 'Tingkat Kelulusan',
  catatan = 'Turunan dari skor IKA.01.A (Tingkat Kelulusan), bobot 0.25'
WHERE kode = 'IKA.03.C.1' AND level = 'LEAF';

UPDATE public.indikator_node 
SET 
  nama = 'Tingkat Pencapaian Sertifikasi Kompetensi',
  catatan = 'Turunan dari skor IKA.01.B (Sertifikasi Kompetensi), bobot 0.25'
WHERE kode = 'IKA.03.C.2' AND level = 'LEAF';

UPDATE public.indikator_node 
SET 
  nama = 'Tingkat Penyerapan Lulusan',
  catatan = 'Turunan dari skor IKA.01.C (Tingkat Penyerapan Lulusan), bobot 0.25'
WHERE kode = 'IKA.03.C.3' AND level = 'LEAF';

UPDATE public.indikator_node 
SET 
  nama = 'Tingkat Kepuasan Pengguna Lulusan',
  catatan = 'Turunan dari skor IKA.01.D (Kepuasan Pengguna Lulusan), bobot 0.25'
WHERE kode = 'IKA.03.C.4' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Tingkat Keterlibatan Industri dalam Perumusan Kebijakan Pengembangan SDM Transportasi Udara'
WHERE kode = 'IKA.03.D' AND level = 'KOMPONEN';

UPDATE public.indikator_node 
SET nama = 'Jumlah Bentuk Keterlibatan Industri/Stakeholder yang Terjalin'
WHERE kode = 'IKA.03.D.1' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Jumlah Bentuk Keterlibatan Industri/Stakeholder yang Mungkin Terjalin'
WHERE kode = 'IKA.03.D.2' AND level = 'LEAF';

-- ----------------------------------------------------------------------------
-- 2. IKA.04: PERBARUI LABEL SESUAI EXCEL & KOREKSI A.1
-- ----------------------------------------------------------------------------
UPDATE public.indikator_node 
SET nama = 'Tingkat Kepuasan Peserta Didik terhadap Layanan Pendidikan dan Pelatihan'
WHERE kode = 'IKA.04.A' AND level = 'KOMPONEN';

-- Koreksi IKA.04.A.1 sesuai Excel (Input jumlah skor mentah, bukan rata-rata)
UPDATE public.indikator_node 
SET nama = 'Jumlah Skor Kepuasan Peserta Didik'
WHERE kode = 'IKA.04.A.1' AND level = 'LEAF';

-- IKA.04.A.2 TETAP: 'Jumlah Responden Peserta Didik' (Pengecualian Disetujui)

UPDATE public.indikator_node 
SET nama = 'Jumlah Dosen dan Instruktur Berkualifikasi'
WHERE kode = 'IKA.04.B.1' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Jumlah Dosen dan Instruktur Tersertifikasi'
WHERE kode = 'IKA.04.B.2' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Jumlah Dosen/Instruktur'
WHERE kode = 'IKA.04.B.3' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Tingkat Ketersediaan dan Kelayakan Sarana dan Prasarana Pembelajaran'
WHERE kode = 'IKA.04.C' AND level = 'KOMPONEN';

-- IKA.04.C.1.1, C.1.2, C.2.1, C.2.2 TETAP: (Pengecualian Disetujui untuk Kejelasan Form UI)

UPDATE public.indikator_node 
SET nama = 'Jumlah UPT yang Menerapkan Standar Mutu ISO 9001'
WHERE kode = 'IKA.04.D.1' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Kepatuhan terhadap Standar Nasional Pendidikan dan Pelatihan Transportasi Udara'
WHERE kode = 'IKA.04.D.2' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Pelaksanaan Audit Internal dan Eksternal secara Berkala'
WHERE kode = 'IKA.04.D.3' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Efektivitas Tindakan Perbaikan dan Pencegahan (Corrective and Preventive Actions)'
WHERE kode = 'IKA.04.D.4' AND level = 'LEAF';

