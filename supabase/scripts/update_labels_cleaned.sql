-- ============================================================================
-- PEMBARUAN LABEL INDIKATOR_NODE (DIJALANKAN SESUDAH DEDUP COMMIT)
-- Aturan:
-- 1. Menghapus akhiran bobot seperti "(Bobot = 0,3)"
-- 2. Mempertahankan label DB yang disetujui (IKA.03.B.1, IKA.04.A.2, IKA.04.C.1.1, C.1.2, C.2.1, C.2.2)
-- 3. Mengoreksi IKA.04.A.1 menjadi "Jumlah Skor Kepuasan Peserta Didik"
-- ============================================================================

-- IKA.03
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

UPDATE public.indikator_node 
SET nama = 'Tingkat Kelulusan'
WHERE kode = 'IKA.03.C.1' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Tingkat Pencapaian Sertifikasi Kompetensi'
WHERE kode = 'IKA.03.C.2' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Tingkat Penyerapan Lulusan'
WHERE kode = 'IKA.03.C.3' AND level = 'LEAF';

UPDATE public.indikator_node 
SET nama = 'Tingkat Kepuasan Pengguna Lulusan'
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

-- IKA.04
UPDATE public.indikator_node 
SET nama = 'Tingkat Kepuasan Peserta Didik terhadap Layanan Pendidikan dan Pelatihan'
WHERE kode = 'IKA.04.A' AND level = 'KOMPONEN';

-- Koreksi IKA.04.A.1 sesuai Excel (Input jumlah skor, bukan rata-rata)
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
