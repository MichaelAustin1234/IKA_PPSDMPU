import fs from 'fs';
import path from 'path';

// Load env
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

(globalThis as any).WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const [{ data: upts }, { data: nodes }] = await Promise.all([
    supabase.from('upt').select('*'),
    supabase.from('indikator_node').select('*'),
  ]);

  const uptMap = new Map<string, string>(upts.map((u: any) => [u.kode, u.id]));
  const nodeMap = new Map<string, any>(nodes.map((n: any) => [n.id, n]));

  function getPath(id: string): string {
    const parts: string[] = [];
    let curr = nodeMap.get(id);
    while (curr) {
      parts.unshift(curr.kode);
      if (!curr.parent_id) break;
      curr = nodeMap.get(curr.parent_id);
    }
    return parts.join('/');
  }

  const VOKASI_7 = ['PPIC', 'POLTEKBANG_SBY', 'POLTEKBANG_MDN', 'POLTEKBANG_MKS', 'POLTEKBANG_PLB', 'POLTEKBANG_JYP', 'API_BANYUWANGI'];
  const KAMPUS_DAN_BALAI_8 = ['PPIC', 'POLTEKBANG_SBY', 'POLTEKBANG_MDN', 'POLTEKBANG_MKS', 'POLTEKBANG_PLB', 'POLTEKBANG_JYP', 'API_BANYUWANGI', 'BP3_CURUG'];
  const SEMUA_9 = ['PPIC', 'POLTEKBANG_SBY', 'POLTEKBANG_MDN', 'POLTEKBANG_MKS', 'POLTEKBANG_PLB', 'POLTEKBANG_JYP', 'API_BANYUWANGI', 'BP3_CURUG', 'PPSDMPU'];

  const insertRows: { node_id: string; node_kode: string; upt_id: string; upt_kode: string }[] = [];

  for (const node of nodes) {
    const p = getPath(node.id);
    let targetUpts: string[] = [];

    // 1. IKA.01
    if (p.includes('/IKA.01/')) {
      targetUpts = VOKASI_7;
    }
    // 2. IKA.02
    else if (p.includes('/IKA.02/')) {
      // Komponen A (Akreditasi Institusi per kampus)
      if (node.kode === 'IKA.02.A.1') targetUpts = ['PPIC'];
      else if (node.kode === 'IKA.02.A.2') targetUpts = ['POLTEKBANG_SBY'];
      else if (node.kode === 'IKA.02.A.3') targetUpts = ['POLTEKBANG_MDN'];
      else if (node.kode === 'IKA.02.A.4') targetUpts = ['POLTEKBANG_MKS'];
      else if (node.kode === 'IKA.02.A.5') targetUpts = ['POLTEKBANG_PLB'];
      else if (node.kode === 'IKA.02.A.6') targetUpts = ['POLTEKBANG_JYP'];
      else if (node.kode === 'IKA.02.A.7') targetUpts = ['API_BANYUWANGI'];
      // Komponen B (Akreditasi Prodi per kampus)
      else if (p.includes('/IKA.02.B.1/')) targetUpts = ['PPIC'];
      else if (p.includes('/IKA.02.B.2/')) targetUpts = ['POLTEKBANG_SBY'];
      else if (p.includes('/IKA.02.B.3/')) targetUpts = ['POLTEKBANG_MDN'];
      else if (p.includes('/IKA.02.B.4/')) targetUpts = ['POLTEKBANG_MKS'];
      else if (p.includes('/IKA.02.B.5/')) targetUpts = ['POLTEKBANG_PLB'];
      else if (p.includes('/IKA.02.B.6/')) targetUpts = ['POLTEKBANG_JYP'];
      else if (p.includes('/IKA.02.B.7/')) targetUpts = ['API_BANYUWANGI'];
      // Komponen C
      else if (node.kode === 'IKA.02.C.1' || node.kode === 'IKA.02.C.2') targetUpts = SEMUA_9;
      // Komponen D
      else if (node.kode === 'IKA.02.D.1.1') targetUpts = KAMPUS_DAN_BALAI_8; // 8 UPT tanpa PPSDMPU
      else if (node.kode === 'IKA.02.D.1.2' || node.kode === 'IKA.02.D.2') targetUpts = SEMUA_9;
      // Node komponen/sub induk IKA.02
      else if (node.level !== 'LEAF') {
        if (node.kode === 'IKA.02.A') targetUpts = VOKASI_7;
        else if (node.kode === 'IKA.02.B.1') targetUpts = ['PPIC'];
        else if (node.kode === 'IKA.02.B.2') targetUpts = ['POLTEKBANG_SBY'];
        else if (node.kode === 'IKA.02.B.3') targetUpts = ['POLTEKBANG_MDN'];
        else if (node.kode === 'IKA.02.B.4') targetUpts = ['POLTEKBANG_MKS'];
        else if (node.kode === 'IKA.02.B.5') targetUpts = ['POLTEKBANG_PLB'];
        else if (node.kode === 'IKA.02.B.6') targetUpts = ['POLTEKBANG_JYP'];
        else if (node.kode === 'IKA.02.B.7') targetUpts = ['API_BANYUWANGI'];
        else if (node.kode === 'IKA.02.B') targetUpts = VOKASI_7;
        else if (node.kode === 'IKA.02.C') targetUpts = SEMUA_9;
        else if (node.kode === 'IKA.02.D') targetUpts = SEMUA_9;
      }
    }
    // 3. IKA.03
    else if (p.includes('/IKA.03/')) {
      if (node.kode === 'IKA.03.D.1' || node.kode === 'IKA.03.D.2') {
        targetUpts = SEMUA_9; // 9 UPT diisi per UPT, dijumlahkan di Matra Udara
      } else {
        targetUpts = ['PPSDMPU']; // A.1, A.2, B.1, B.2, C.1-C.4 adalah kebijakan Pusat
      }
    }
    // 4. IKA.04
    else if (p.includes('/IKA.04/')) {
      if (p.includes('/IKA.04.A/')) {
        targetUpts = VOKASI_7; // 7 UPT vokasi (tanpa BP3 dan PPSDMPU)
      } else if (p.includes('/IKA.04.B/') || p.includes('/IKA.04.C/')) {
        targetUpts = KAMPUS_DAN_BALAI_8; // 8 UPT (tanpa PPSDMPU)
      } else if (p.includes('/IKA.04.D/')) {
        targetUpts = ['PPSDMPU']; // Standar mutu & CAPA hanya diinput Pusat
      }
    }
    // 5. IKA.05
    else if (p.includes('/IKA.05/')) {
      if (node.kode === 'IKA.05.1') targetUpts = ['PPSDMPU'];
      else if (node.kode === 'IKA.05.2') targetUpts = ['PPIC'];
      else if (node.kode === 'IKA.05.3') targetUpts = ['POLTEKBANG_SBY'];
      else if (node.kode === 'IKA.05.4') targetUpts = ['POLTEKBANG_MDN'];
      else if (node.kode === 'IKA.05.5') targetUpts = ['POLTEKBANG_MKS'];
      else if (node.kode === 'IKA.05.6') targetUpts = ['POLTEKBANG_PLB'];
      else if (node.kode === 'IKA.05.7') targetUpts = ['POLTEKBANG_JYP'];
      else if (node.kode === 'IKA.05.8') targetUpts = ['API_BANYUWANGI'];
      else if (node.kode === 'IKA.05.9') targetUpts = ['BP3_CURUG'];
      else if (node.level !== 'LEAF') targetUpts = SEMUA_9;
    }
    // 6. IKA.06
    else if (p.includes('/IKA.06/')) {
      if (node.kode === 'IKA.06.B.2.4') {
        targetUpts = ['PPSDMPU']; // Baris 153 khusus PPSDMPU
      } else if (p.includes('/IKA.06.D/')) {
        targetUpts = KAMPUS_DAN_BALAI_8; // BLU 8 UPT, PPSDMPU N/A
      } else {
        targetUpts = SEMUA_9; // A, B lainnya, C: 9 UPT
      }
    }

    // Masukkan relasi untuk leaf node (dan node induk yang relevan)
    if (node.level === 'LEAF') {
      for (const uk of targetUpts) {
        const uid = uptMap.get(uk);
        if (uid) {
          insertRows.push({
            node_id: node.id,
            node_kode: node.kode,
            upt_id: uid,
            upt_kode: uk,
          });
        }
      }
    }
  }

  console.log('Total baris node_upt LEAF yang dihasilkan dari Excel:', insertRows.length);

  // Buat skrip migrasi SQL
  let sql = `-- ============================================================================
-- MIGRATION: REBUILD TABEL NODE_UPT BERDASARKAN EXCEL CAPKIN ("IKA TW 2 2026")
-- Sistem Informasi Capaian Kinerja Antara (IKA) PPSDMPU
--
-- Menghapus data node_upt lama dan membangun ulang sesuai bukti sel Excel:
-- - IKA.01: 7 UPT Vokasi (PPIC, SBY, MDN, MKS, PLB, JYP, API). BP3 & PPSDMPU N/A.
-- - IKA.02: A.1-A.7 (1 UPT/kampus), B.1-B.7 (33 prodi per kampus), C.1-C.2 (9 UPT),
--           D.1.1 (8 UPT tanpa PPSDMPU), D.1.2 & D.2 (9 UPT).
-- - IKA.03: A.1-B.2 & C.1-C.4 (PPSDMPU), D.1-D.2 (9 UPT).
-- - IKA.04: A (7 UPT Vokasi), B & C (8 UPT), D (PPSDMPU).
-- - IKA.05: 1 leaf per UPT pemiliknya (1 PPSDMPU + 8 UPT).
-- - IKA.06: A & C (9 UPT), B.2.4 (PPSDMPU), D BLU (8 UPT).
-- ============================================================================

BEGIN;

-- 1. Kosongkan tabel node_upt saat ini (sudah dibackup di schema backup)
TRUNCATE TABLE public.node_upt;

-- 2. Insert relasi whitelist baru
INSERT INTO public.node_upt (node_id, upt_id, berlaku)
VALUES
`;

  const valuesSql = insertRows.map(r => `  ('${r.node_id}', '${r.upt_id}', TRUE)`).join(',\n');
  sql += valuesSql + `;\n\nCOMMIT;\n`;

  fs.writeFileSync('supabase/migrations/0010_rebuild_node_upt_from_excel.sql', sql, 'utf-8');
  console.log('File supabase/migrations/0010_rebuild_node_upt_from_excel.sql berhasil dibuat!');
}

main().catch(console.error);

