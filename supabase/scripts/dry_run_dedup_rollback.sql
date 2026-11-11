-- ============================================================================
-- SKRIP DRY-RUN DEDUPLIKASI INDIKATOR_NODE & MERGE NODE_UPT (ROLLBACK)
-- Sistem Informasi Capaian Kinerja Antara (IKA) PPSDMPU
--
-- ATURAN:
-- 1. Berjalan dalam 1 transaksi tunggal. Diakhiri dengan ROLLBACK (tidak ada perubahan permanen).
-- 2. Akar kanonik ditentukan dinamis dari 6 prefix ID IKA kanonik (tidak hardcode UUID SKA).
-- 3. Tabel backup dibuat di dalam schema 'backup' (bukan schema public).
-- 4. node_upt digabungkan per jalur kode dengan bool_or(berlaku) dan GROUP BY (can_id, upt_id).
-- 5. Semua assertion diverifikasi; jika ada ketidaksesuaian akan RAISE EXCEPTION dan abort.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. BUAT SCHEMA BACKUP & SIMPAN DATA SAAT INI
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS backup;

CREATE TABLE backup.indikator_node_bak AS 
SELECT * FROM public.indikator_node;

CREATE TABLE backup.node_upt_bak AS 
SELECT * FROM public.node_upt;

-- ----------------------------------------------------------------------------
-- 2. RESOLUSI AKAR KANONIK SECARA DINAMIS DARI 6 PREFIX ID IKA
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE temp_canonical_ika_prefixes (
  prefix text PRIMARY KEY,
  expected_ika text NOT NULL,
  expected_ska text NOT NULL
);

INSERT INTO temp_canonical_ika_prefixes (prefix, expected_ika, expected_ska) VALUES
  ('af0f3e46', 'IKA.01', 'SKA.01'),
  ('f500562d', 'IKA.02', 'SKA.02'),
  ('8763bd96', 'IKA.03', 'SKA.03'),
  ('6b168521', 'IKA.04', 'SKA.04'),
  ('d4d7722e', 'IKA.05', 'SKA.05'),
  ('f2b77800', 'IKA.06', 'SKA.06');

CREATE TEMP TABLE temp_canonical_roots AS
SELECT 
  p.prefix,
  i.id AS ika_id,
  i.kode AS ika_kode,
  s.id AS ska_id,
  s.kode AS ska_kode
FROM temp_canonical_ika_prefixes p
JOIN public.indikator_node i ON i.id::text LIKE (p.prefix || '%')
LEFT JOIN public.indikator_node s ON s.id = i.parent_id;

-- ASSERTION 1: Tiap prefix cocok tepat 1 baris, kodenya IKA.01..06 dan SKA.01..06
DO $$
DECLARE
  v_count int;
  v_mismatch int;
BEGIN
  SELECT count(*) INTO v_count FROM temp_canonical_roots;
  IF v_count <> 6 THEN
    RAISE EXCEPTION 'ASSERTION 1 GAGAL: Ditemukan % akar IKA, diharapkan tepat 6.', v_count;
  END IF;

  SELECT count(*) INTO v_mismatch
  FROM temp_canonical_roots r
  JOIN temp_canonical_ika_prefixes p ON r.prefix = p.prefix
  WHERE r.ika_kode <> p.expected_ika OR r.ska_kode <> p.expected_ska;

  IF v_mismatch > 0 THEN
    RAISE EXCEPTION 'ASSERTION 1 GAGAL: Ada % akar IKA/SKA yang kodenya tidak cocok.', v_mismatch;
  END IF;

  RAISE NOTICE '✅ ASSERTION 1 LOLOS: 6 Akar Kanonik SKA & IKA terverifikasi secara dinamis.';
END $$;

-- ----------------------------------------------------------------------------
-- 3. KUMPULKAN SELURUH SUBTREE KANONIKAL SECARA REKURSIF
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE temp_canonical_nodes AS
WITH RECURSIVE c_tree AS (
  -- Level SKA
  SELECT id, parent_id, kode, level, nama
  FROM public.indikator_node
  WHERE id IN (SELECT ska_id FROM temp_canonical_roots)
  UNION ALL
  -- Level Anak (IKA -> KOMPONEN -> SUB -> LEAF)
  SELECT child.id, child.parent_id, child.kode, child.level, child.nama
  FROM public.indikator_node child
  JOIN c_tree parent ON child.parent_id = parent.id
)
SELECT id, parent_id, kode, level, nama FROM c_tree;

-- ASSERTION 2: Pohon Kanonikal tepat 162 node
DO $$
DECLARE
  v_total int;
  v_ska int;
  v_ika int;
  v_komp int;
  v_sub int;
  v_leaf int;
BEGIN
  SELECT count(*) INTO v_total FROM temp_canonical_nodes;
  SELECT count(*) INTO v_ska FROM temp_canonical_nodes WHERE level = 'SKA';
  SELECT count(*) INTO v_ika FROM temp_canonical_nodes WHERE level = 'IKA';
  SELECT count(*) INTO v_komp FROM temp_canonical_nodes WHERE level = 'KOMPONEN';
  SELECT count(*) INTO v_sub FROM temp_canonical_nodes WHERE level = 'SUB';
  SELECT count(*) INTO v_leaf FROM temp_canonical_nodes WHERE level = 'LEAF';

  IF v_total <> 162 OR v_ska <> 6 OR v_ika <> 6 OR v_komp <> 18 OR v_sub <> 19 OR v_leaf <> 113 THEN
    RAISE EXCEPTION 'ASSERTION 2 GAGAL: Komposisi kanonikal tidak cocok! Total=%, SKA=%, IKA=%, KOMP=%, SUB=%, LEAF=% (Harapan: 162/6/6/18/19/113)',
      v_total, v_ska, v_ika, v_komp, v_sub, v_leaf;
  END IF;

  RAISE NOTICE '✅ ASSERTION 2 LOLOS: Pohon Kanonikal tepat 162 node (6 SKA, 6 IKA, 18 KOMPONEN, 19 SUB, 113 LEAF).';
END $$;

-- ----------------------------------------------------------------------------
-- 4. BANGUN JALUR KODE (PATH) & PEMETAAN 1:1 DUPLIKAT -> KANONIKAL
-- ----------------------------------------------------------------------------
CREATE TEMP TABLE temp_node_path AS
WITH RECURSIVE p AS (
  SELECT id, kode::text AS path 
  FROM public.indikator_node 
  WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, p.path || '/' || c.kode 
  FROM public.indikator_node c 
  JOIN p ON c.parent_id = p.id
) 
SELECT id, path FROM p;

CREATE TEMP TABLE temp_node_map AS
SELECT d.id AS dup_id, c.id AS can_id, d.path
FROM temp_node_path d
JOIN temp_node_path c ON c.path = d.path
WHERE d.id NOT IN (SELECT id FROM temp_canonical_nodes)
  AND c.id IN (SELECT id FROM temp_canonical_nodes);

-- ASSERTION 3: Pemetaan 1:1 tepat 176 baris duplikat
DO $$
DECLARE
  v_map_count int;
  v_distinct_dup int;
  v_total_dup int;
BEGIN
  SELECT count(*) INTO v_total_dup 
  FROM public.indikator_node 
  WHERE id NOT IN (SELECT id FROM temp_canonical_nodes);

  SELECT count(*), count(DISTINCT dup_id) 
  INTO v_map_count, v_distinct_dup 
  FROM temp_node_map;

  IF v_map_count <> 176 OR v_distinct_dup <> 176 OR v_total_dup <> 176 THEN
    RAISE EXCEPTION 'ASSERTION 3 GAGAL: Pemetaan node_map tidak 1:1 (map=%, distinct_dup=%, total_dup=%, harapan 176).',
      v_map_count, v_distinct_dup, v_total_dup;
  END IF;

  RAISE NOTICE '✅ ASSERTION 3 LOLOS: Pemetaan 1:1 tepat 176 node duplikat ke kanonikal berhasil.';
END $$;

-- ----------------------------------------------------------------------------
-- 5. GABUNGKAN NODE_UPT KE KANONIKAL DENGAN GROUP BY & BOOL_OR(BERLAKU)
-- ----------------------------------------------------------------------------
INSERT INTO public.node_upt (node_id, upt_id, berlaku)
SELECT 
  m.can_id,
  nu.upt_id,
  bool_or(nu.berlaku) AS berlaku
FROM public.node_upt nu
JOIN temp_node_map m ON nu.node_id = m.dup_id
GROUP BY m.can_id, nu.upt_id
ON CONFLICT (node_id, upt_id)
DO UPDATE SET berlaku = public.node_upt.berlaku OR EXCLUDED.berlaku;

-- ----------------------------------------------------------------------------
-- 6. BERSIHKAN REFERENSI & HAPUS DUPLIKAT SECARA BERJENJANG DARI LEAF
-- ----------------------------------------------------------------------------
-- Hapus baris node_upt duplikat
DELETE FROM public.node_upt
WHERE node_id IN (SELECT dup_id FROM temp_node_map);

-- Arahkan max_ref_node_id di pohon kanonikal ke node kanonikal
UPDATE public.indikator_node n
SET max_ref_node_id = m.can_id
FROM temp_node_map m
WHERE n.max_ref_node_id = m.dup_id
  AND n.id IN (SELECT id FROM temp_canonical_nodes);

-- Hapus node duplikat berjenjang dari LEAF ke atas
DELETE FROM public.indikator_node WHERE id IN (SELECT dup_id FROM temp_node_map) AND level = 'LEAF';
DELETE FROM public.indikator_node WHERE id IN (SELECT dup_id FROM temp_node_map) AND level = 'SUB';
DELETE FROM public.indikator_node WHERE id IN (SELECT dup_id FROM temp_node_map) AND level = 'KOMPONEN';
DELETE FROM public.indikator_node WHERE id IN (SELECT dup_id FROM temp_node_map) AND level = 'IKA';
DELETE FROM public.indikator_node WHERE id IN (SELECT dup_id FROM temp_node_map) AND level = 'SKA';

-- ASSERTION 4: Pastikan tersisa tepat 162 baris di indikator_node
DO $$
DECLARE
  v_final_count int;
BEGIN
  SELECT count(*) INTO v_final_count FROM public.indikator_node;
  IF v_final_count <> 162 THEN
    RAISE EXCEPTION 'ASSERTION 4 GAGAL: Tersisa % baris di indikator_node (diharapkan tepat 162).', v_final_count;
  END IF;

  RAISE NOTICE '✅ ASSERTION 4 LOLOS: Tepat 162 baris tersisa di tabel indikator_node.';
END $$;

-- ----------------------------------------------------------------------------
-- 7. CETAK HASIL AUDIT SEBELUM ROLLBACK
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  v_count int := 0;
  v_ska int; v_ika int; v_komp int; v_sub int; v_leaf int;
BEGIN
  SELECT count(*) INTO v_ska FROM public.indikator_node WHERE level = 'SKA';
  SELECT count(*) INTO v_ika FROM public.indikator_node WHERE level = 'IKA';
  SELECT count(*) INTO v_komp FROM public.indikator_node WHERE level = 'KOMPONEN';
  SELECT count(*) INTO v_sub FROM public.indikator_node WHERE level = 'SUB';
  SELECT count(*) INTO v_leaf FROM public.indikator_node WHERE level = 'LEAF';

  RAISE NOTICE '====================================================================';
  RAISE NOTICE 'HASIL DRY-RUN SEBELUM ROLLBACK:';
  RAISE NOTICE '  - Total Node Tersisa   : % (Harapan: 162)', (v_ska + v_ika + v_komp + v_sub + v_leaf);
  RAISE NOTICE '  - Komposisi Level      : % SKA, % IKA, % KOMPONEN, % SUB, % LEAF', v_ska, v_ika, v_komp, v_sub, v_leaf;
  RAISE NOTICE '--------------------------------------------------------------------';
  RAISE NOTICE 'DAFTAR LEAF KANONIK TANPA BARIS NODE_UPT SAMA SEKALI:';

  FOR r IN (
    SELECT c.kode, c.nama, p.path
    FROM temp_canonical_nodes c
    JOIN temp_node_path p ON c.id = p.id
    WHERE c.level = 'LEAF'
      AND NOT EXISTS (SELECT 1 FROM public.node_upt nu WHERE nu.node_id = c.id)
    ORDER BY p.path
  ) LOOP
    v_count := v_count + 1;
    RAISE NOTICE '  %. [%] % (Path: %)', v_count, r.kode, r.nama, r.path;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '  (Semua leaf memiliki relasi node_upt)';
  ELSE
    RAISE NOTICE 'Total leaf tanpa relasi node_upt: % leaf', v_count;
  END IF;
  RAISE NOTICE '====================================================================';
END $$;

-- ----------------------------------------------------------------------------
-- 8. BATALKAN TRANSAKSI (DRY-RUN TANPA PERUBAHAN PERMANEN)
-- ----------------------------------------------------------------------------
ROLLBACK;

