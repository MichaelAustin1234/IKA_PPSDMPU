import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${val.toString().replace(/'/g, "''")}'`;
}

async function exportAll() {
  console.log('Fetching database tables from Supabase...');

  const [{ data: upt }, { data: predikat }, { data: periode }, { data: target }, { data: nodes }, { data: nodeUpt }] =
    await Promise.all([
      supabase.from('upt').select('*').order('kode'),
      supabase.from('predikat_konversi').select('*').order('skor', { ascending: false }),
      supabase.from('periode').select('*').order('tahun').order('triwulan'),
      supabase.from('target_tahunan').select('*'),
      supabase.from('indikator_node').select('*').order('urutan'),
      supabase.from('node_upt').select('*'),
    ]);

  let sql = `-- ============================================================
-- SKEMA & MASTER DATA SISTEM INFORMASI IKA PPSDMPU
-- Generated: ${new Date().toISOString()}
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABEL UPT
CREATE TABLE IF NOT EXISTS upt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text UNIQUE NOT NULL,
  nama text NOT NULL
);

-- 2. TABEL PROFILES (Terkoneksi ke auth.users Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN_UPT', 'SUPER_ADMIN', 'PIMPINAN')),
  upt_id uuid REFERENCES upt(id),
  created_at timestamptz DEFAULT now()
);

-- 3. TABEL INDIKATOR_NODE (Pohon Hierarki IKA)
CREATE TABLE IF NOT EXISTS indikator_node (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES indikator_node(id),
  kode text NOT NULL,
  nama text NOT NULL,
  level text NOT NULL CHECK (level IN ('SKA','IKA','KOMPONEN','SUB','LEAF')),
  bobot numeric NOT NULL DEFAULT 0,
  tipe_input text NOT NULL CHECK (tipe_input IN ('ANGKA','PREDIKAT','TURUNAN')),
  cap_100 boolean NOT NULL DEFAULT false,
  min_nilai numeric,
  max_nilai numeric,
  max_ref_node_id uuid REFERENCES indikator_node(id),
  max_persen numeric,
  urutan int DEFAULT 0,
  catatan text
);

CREATE INDEX IF NOT EXISTS idx_indikator_node_parent ON indikator_node(parent_id);

-- 4. TABEL NODE_UPT (Keterberlakuan node per UPT)
CREATE TABLE IF NOT EXISTS node_upt (
  node_id uuid REFERENCES indikator_node(id) ON DELETE CASCADE,
  upt_id uuid REFERENCES upt(id) ON DELETE CASCADE,
  berlaku boolean NOT NULL DEFAULT true,
  PRIMARY KEY (node_id, upt_id)
);

-- 5. TABEL PREDIKAT_KONVERSI
CREATE TABLE IF NOT EXISTS predikat_konversi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jenis text NOT NULL,
  predikat text NOT NULL,
  skor numeric NOT NULL
);

-- 6. TABEL PERIODE
CREATE TABLE IF NOT EXISTS periode (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun int NOT NULL,
  triwulan int NOT NULL CHECK (triwulan BETWEEN 1 AND 4),
  status text NOT NULL DEFAULT 'BUKA' CHECK (status IN ('BUKA','TUTUP')),
  UNIQUE (tahun, triwulan)
);

-- 7. TABEL LAPORAN (Laporan UPT per Triwulan)
CREATE TABLE IF NOT EXISTS laporan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upt_id uuid REFERENCES upt(id) NOT NULL,
  periode_id uuid REFERENCES periode(id) NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED')),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  catatan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (upt_id, periode_id)
);

-- 8. TABEL LAPORAN_ISI (Nilai Leaf Node per Laporan)
CREATE TABLE IF NOT EXISTS laporan_isi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laporan_id uuid REFERENCES laporan(id) ON DELETE CASCADE,
  node_id uuid REFERENCES indikator_node(id) NOT NULL,
  nilai_angka numeric,
  predikat_id uuid REFERENCES predikat_konversi(id),
  sumber text NOT NULL DEFAULT 'MANUAL' CHECK (sumber IN ('MANUAL','API')),
  keterangan text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (laporan_id, node_id)
);

-- 9. TABEL HASIL_HITUNG (Snapshot Hasil Perhitungan Skor)
CREATE TABLE IF NOT EXISTS hasil_hitung (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  laporan_id uuid REFERENCES laporan(id) ON DELETE CASCADE,
  node_id uuid REFERENCES indikator_node(id) NOT NULL,
  realisasi numeric,
  skor_normalisasi numeric,
  skor_terbobot numeric,
  dihitung_pada timestamptz DEFAULT now(),
  UNIQUE (laporan_id, node_id)
);

-- 10. TABEL TARGET_TAHUNAN (Target Renstra 2025-2029)
CREATE TABLE IF NOT EXISTS target_tahunan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid REFERENCES indikator_node(id) NOT NULL,
  tahun int NOT NULL,
  target numeric NOT NULL,
  UNIQUE (node_id, tahun)
);

-- 11. TABEL UPT_API_CONFIG
CREATE TABLE IF NOT EXISTS upt_api_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upt_id uuid REFERENCES upt(id) UNIQUE,
  base_url text,
  auth_type text CHECK (auth_type IN ('API_KEY','BEARER')),
  secret_ref text,
  aktif boolean DEFAULT false
);

-- 12. TABEL SYNC_LOG
CREATE TABLE IF NOT EXISTS sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upt_id uuid REFERENCES upt(id),
  periode_id uuid REFERENCES periode(id),
  status text CHECK (status IN ('SUKSES','GAGAL','SEBAGIAN')),
  detail jsonb,
  dijalankan_pada timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan ENABLE ROW LEVEL SECURITY;
ALTER TABLE laporan_isi ENABLE ROW LEVEL SECURITY;
ALTER TABLE hasil_hitung ENABLE ROW LEVEL SECURITY;
ALTER TABLE indikator_node ENABLE ROW LEVEL SECURITY;
ALTER TABLE upt ENABLE ROW LEVEL SECURITY;
ALTER TABLE periode ENABLE ROW LEVEL SECURITY;
ALTER TABLE predikat_konversi ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_upt ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_tahunan ENABLE ROW LEVEL SECURITY;

-- Profiles: pengguna membaca profilnya sendiri
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

-- Master data: dapat dibaca oleh seluruh user terautentikasi
DROP POLICY IF EXISTS "upt_read_all" ON upt;
CREATE POLICY "upt_read_all" ON upt
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "indikator_node_read_all" ON indikator_node;
CREATE POLICY "indikator_node_read_all" ON indikator_node
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "periode_read_all" ON periode;
CREATE POLICY "periode_read_all" ON periode
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "predikat_konversi_read_all" ON predikat_konversi;
CREATE POLICY "predikat_konversi_read_all" ON predikat_konversi
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "node_upt_read_all" ON node_upt;
CREATE POLICY "node_upt_read_all" ON node_upt
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "target_tahunan_read_all" ON target_tahunan;
CREATE POLICY "target_tahunan_read_all" ON target_tahunan
  FOR SELECT TO authenticated USING (true);

-- Laporan: Admin UPT membaca/menulis laporan UPT miliknya, Super Admin & Pimpinan membaca semua
DROP POLICY IF EXISTS "laporan_admin_upt_rw" ON laporan;
CREATE POLICY "laporan_admin_upt_rw" ON laporan
  FOR ALL TO authenticated
  USING (
    upt_id = (SELECT upt_id FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN','PIMPINAN')
  )
  WITH CHECK (
    upt_id = (SELECT upt_id FROM profiles WHERE id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
  );

-- Laporan Isi: menginduk ke izin laporan
DROP POLICY IF EXISTS "laporan_isi_rw" ON laporan_isi;
CREATE POLICY "laporan_isi_rw" ON laporan_isi
  FOR ALL TO authenticated
  USING (
    laporan_id IN (
      SELECT id FROM laporan
      WHERE upt_id = (SELECT upt_id FROM profiles WHERE id = auth.uid())
         OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN','PIMPINAN')
    )
  )
  WITH CHECK (
    laporan_id IN (
      SELECT id FROM laporan
      WHERE upt_id = (SELECT upt_id FROM profiles WHERE id = auth.uid())
         OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
    )
  );

-- Hasil Hitung: menginduk ke izin laporan
DROP POLICY IF EXISTS "hasil_hitung_read" ON hasil_hitung;
CREATE POLICY "hasil_hitung_read" ON hasil_hitung
  FOR SELECT TO authenticated
  USING (
    laporan_id IN (
      SELECT id FROM laporan
      WHERE upt_id = (SELECT upt_id FROM profiles WHERE id = auth.uid())
         OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN','PIMPINAN')
    )
  );

-- ============================================================
-- MASTER DATA INITIAL SEED
-- ============================================================
`;

  // 1. UPT
  if (upt && upt.length > 0) {
    sql += `\n-- DATA UPT\nINSERT INTO upt (id, kode, nama) VALUES\n`;
    sql += upt.map((u) => `  (${escapeSql(u.id)}, ${escapeSql(u.kode)}, ${escapeSql(u.nama)})`).join(',\n');
    sql += `\nON CONFLICT (kode) DO UPDATE SET nama = EXCLUDED.nama;\n`;
  }

  // 2. Predikat Konversi
  if (predikat && predikat.length > 0) {
    sql += `\n-- DATA PREDIKAT KONVERSI\nINSERT INTO predikat_konversi (id, jenis, predikat, skor) VALUES\n`;
    sql += predikat.map((p) => `  (${escapeSql(p.id)}, ${escapeSql(p.jenis)}, ${escapeSql(p.predikat)}, ${escapeSql(p.skor)})`).join(',\n');
    sql += `\nON CONFLICT (id) DO NOTHING;\n`;
  }

  // 3. Periode
  if (periode && periode.length > 0) {
    sql += `\n-- DATA PERIODE\nINSERT INTO periode (id, tahun, triwulan, status) VALUES\n`;
    sql += periode.map((p) => `  (${escapeSql(p.id)}, ${escapeSql(p.tahun)}, ${escapeSql(p.triwulan)}, ${escapeSql(p.status)})`).join(',\n');
    sql += `\nON CONFLICT (tahun, triwulan) DO UPDATE SET status = EXCLUDED.status;\n`;
  }

  // 4. Indikator Node (top-down: null parent_id first, then children)
  if (nodes && nodes.length > 0) {
    sql += `\n-- DATA INDIKATOR NODE (Pohon IKA)\n`;
    // Urutkan: level SKA, IKA, KOMPONEN, SUB, LEAF
    const levelOrder: Record<string, number> = { SKA: 1, IKA: 2, KOMPONEN: 3, SUB: 4, LEAF: 5 };
    const sortedNodes = [...nodes].sort((a, b) => (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99) || (a.urutan || 0) - (b.urutan || 0));

    // Batch insert 50 nodes per query
    const batchSize = 50;
    for (let i = 0; i < sortedNodes.length; i += batchSize) {
      const batch = sortedNodes.slice(i, i + batchSize);
      sql += `INSERT INTO indikator_node (id, parent_id, kode, nama, level, bobot, tipe_input, cap_100, min_nilai, max_nilai, max_ref_node_id, max_persen, urutan, catatan) VALUES\n`;
      sql += batch
        .map(
          (n) =>
            `  (${escapeSql(n.id)}, ${escapeSql(n.parent_id)}, ${escapeSql(n.kode)}, ${escapeSql(n.nama)}, ${escapeSql(n.level)}, ${escapeSql(n.bobot)}, ${escapeSql(n.tipe_input)}, ${escapeSql(n.cap_100)}, ${escapeSql(n.min_nilai)}, ${escapeSql(n.max_nilai)}, ${escapeSql(n.max_ref_node_id)}, ${escapeSql(n.max_persen)}, ${escapeSql(n.urutan)}, ${escapeSql(n.catatan)})`
        )
        .join(',\n');
      sql += `\nON CONFLICT (id) DO UPDATE SET\n  kode = EXCLUDED.kode,\n  nama = EXCLUDED.nama,\n  bobot = EXCLUDED.bobot,\n  tipe_input = EXCLUDED.tipe_input,\n  cap_100 = EXCLUDED.cap_100,\n  min_nilai = EXCLUDED.min_nilai,\n  max_nilai = EXCLUDED.max_nilai,\n  urutan = EXCLUDED.urutan;\n\n`;
    }
  }

  // 5. Node UPT
  if (nodeUpt && nodeUpt.length > 0) {
    sql += `\n-- DATA KETERBERLAKUAN NODE PER UPT (node_upt)\n`;
    const batchSize = 100;
    for (let i = 0; i < nodeUpt.length; i += batchSize) {
      const batch = nodeUpt.slice(i, i + batchSize);
      sql += `INSERT INTO node_upt (node_id, upt_id, berlaku) VALUES\n`;
      sql += batch.map((nu) => `  (${escapeSql(nu.node_id)}, ${escapeSql(nu.upt_id)}, ${escapeSql(nu.berlaku)})`).join(',\n');
      sql += `\nON CONFLICT (node_id, upt_id) DO UPDATE SET berlaku = EXCLUDED.berlaku;\n\n`;
    }
  }

  const outputPath = path.resolve(process.cwd(), 'supabase', 'schema_lengkap_ika_ppsdmpu.sql');
  fs.writeFileSync(outputPath, sql, 'utf-8');
  console.log(`✅ File SQL berhasil diekspor ke: ${outputPath} (${sql.length} bytes)`);
}

exportAll().catch(console.error);
