import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepDiagnose() {
  console.log('================================================================');
  console.log('🔬 AUDIT MENDALAM READ-ONLY (POIN 1, 2, 3, 4, 5, 10)');
  console.log('================================================================\n');

  // Ambil semua data indikator_node, node_upt, target_tahunan
  const [{ data: nodes }, { data: nodeUpt }, { data: targetTahunan }] = await Promise.all([
    supabase.from('indikator_node').select('*'),
    supabase.from('node_upt').select('*'),
    supabase.from('target_tahunan').select('*'),
  ]);

  if (!nodes) {
    console.error('Gagal mengambil nodes');
    return;
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // -------------------------------------------------------------
  // POIN 1: 15 BARIS IKA (Jelaskan selisih 15 vs 13)
  // -------------------------------------------------------------
  console.log('--- POIN 1: INVESTIGASI 15 BARIS IKA ---');
  const ikaNodes = nodes.filter((n) => n.level === 'IKA');
  console.log(`Ditemukan ${ikaNodes.length} baris dengan level = 'IKA':`);

  // Hitung jumlah anak untuk tiap IKA
  for (const ika of ikaNodes) {
    const parent = ika.parent_id ? nodeMap.get(ika.parent_id) : null;
    const directChildren = nodes.filter((n) => n.parent_id === ika.id);
    
    // Hitung seluruh leaf di bawah IKA ini
    let leafCount = 0;
    function countLeaves(parentId: string) {
      const children = nodes!.filter((n) => n.parent_id === parentId);
      for (const c of children) {
        if (c.level === 'LEAF') leafCount++;
        else countLeaves(c.id);
      }
    }
    countLeaves(ika.id);

    console.log(
      ` - Kode: ${ika.kode} | ID: ${ika.id.slice(0, 8)} | Parent SKA: ${parent?.kode || 'NONE'} (${ika.parent_id?.slice(0, 8) || 'ROOT'}) | Anak Langsung: ${directChildren.length} | Total Leaf: ${leafCount} | Nama: ${ika.nama}`
    );
  }

  // -------------------------------------------------------------
  // POIN 2: PERBANDINGAN SALINAN PER IKA MENURUT JALUR KODE
  // -------------------------------------------------------------
  console.log('\n--- POIN 2: PERBANDINGAN STRUKTUR & ATRIBUT ANTAR SALINAN ---');

  // Dapatkan root IKA ID untuk setiap node
  function getRootIkaId(id: string): string | null {
    let curr = nodeMap.get(id);
    while (curr) {
      if (curr.level === 'IKA') return curr.id;
      if (!curr.parent_id) break;
      curr = nodeMap.get(curr.parent_id);
    }
    return null;
  }

  // Dapatkan path kode lengkap (misal IKA.02/A/A.1/Leaf1)
  function getCodePath(id: string): string {
    const parts: string[] = [];
    let curr = nodeMap.get(id);
    while (curr) {
      if (curr.level !== 'SKA') {
        parts.unshift(curr.kode || curr.nama);
      }
      if (!curr.parent_id) break;
      curr = nodeMap.get(curr.parent_id);
    }
    return parts.join(' > ');
  }

  // Kelompokkan per IKA (misal IKA.02, IKA.03, dll)
  const ikas = ['IKA.01', 'IKA.02', 'IKA.03', 'IKA.04', 'IKA.05', 'IKA.06'];
  for (const ikaKode of ikas) {
    const salinanIka = ikaNodes.filter((n) => n.kode === ikaKode);
    console.log(`\n• [${ikaKode}] Jumlah Salinan: ${salinanIka.length}`);

    if (salinanIka.length > 1) {
      // Bandingkan node-node di bawah tiap salinan
      const trees: Record<string, typeof nodes> = {};
      for (const s of salinanIka) {
        const subtree = nodes.filter((n) => getRootIkaId(n.id) === s.id);
        trees[s.id] = subtree;
        console.log(`   * Salinan ID: ${s.id.slice(0, 8)} -> Total node: ${subtree.length} (Leaf: ${subtree.filter(n => n.level === 'LEAF').length})`);
      }

      // Bandingkan apakah ada perbedaan atribut untuk node dengan nama/urutan yang sama
      const sampleSalinan = Object.values(trees);
      const baseTree = sampleSalinan[0];
      const otherTrees = sampleSalinan.slice(1);

      let differencesFound = 0;
      for (const nodeA of baseTree) {
        for (const otherTree of otherTrees) {
          const matchB = otherTree.find((n) => n.kode === nodeA.kode && n.nama === nodeA.nama && n.level === nodeA.level);
          if (!matchB) {
            console.log(`     ⚠️ Node "${nodeA.kode} - ${nodeA.nama}" ada di salinan 1 tapi tidak ditemukan di salinan lain!`);
            differencesFound++;
          } else {
            // Bandingkan atribut
            const diffs: string[] = [];
            if (nodeA.bobot !== matchB.bobot) diffs.push(`bobot: ${nodeA.bobot} vs ${matchB.bobot}`);
            if (nodeA.tipe_input !== matchB.tipe_input) diffs.push(`tipe_input: ${nodeA.tipe_input} vs ${matchB.tipe_input}`);
            if (nodeA.min_nilai !== matchB.min_nilai) diffs.push(`min_nilai: ${nodeA.min_nilai} vs ${matchB.min_nilai}`);
            if (nodeA.max_nilai !== matchB.max_nilai) diffs.push(`max_nilai: ${nodeA.max_nilai} vs ${matchB.max_nilai}`);
            if (nodeA.max_persen !== matchB.max_persen) diffs.push(`max_persen: ${nodeA.max_persen} vs ${matchB.max_persen}`);
            if (nodeA.cap_100 !== matchB.cap_100) diffs.push(`cap_100: ${nodeA.cap_100} vs ${matchB.cap_100}`);

            if (diffs.length > 0) {
              console.log(`     ⚠️ Perbedaan atribut pada [${nodeA.kode} - ${nodeA.nama}]: ${diffs.join(', ')}`);
              differencesFound++;
            }
          }
        }
      }

      if (differencesFound === 0) {
        console.log(`     ✅ Seluruh node dalam salinan ${ikaKode} identik 100% dari segi kode, nama, level, bobot, dan atribut.`);
      }
    }
  }

  // -------------------------------------------------------------
  // POIN 3: GABUNGAN NODE_UPT (UNION) & CEK KONFLIK BERLAKU
  // -------------------------------------------------------------
  console.log('\n--- POIN 3: CEK NODE_UPT & KONFLIK BERLAKU ---');
  console.log(`Total baris di node_upt: ${nodeUpt?.length || 0}`);

  // Kelompokkan node_upt berdasarkan jalur kode node
  const nodeUptByCodeAndUpt: Record<string, { berlaku: boolean; nodeId: string }[]> = {};
  nodeUpt?.forEach((nu) => {
    const node = nodeMap.get(nu.node_id);
    if (!node) return;
    const pathKey = `${node.kode}:::${node.nama}:::${nu.upt_id}`;
    if (!nodeUptByCodeAndUpt[pathKey]) nodeUptByCodeAndUpt[pathKey] = [];
    nodeUptByCodeAndUpt[pathKey].push({ berlaku: nu.berlaku, nodeId: nu.node_id });
  });

  let conflictCount = 0;
  for (const [key, entries] of Object.entries(nodeUptByCodeAndUpt)) {
    const hasTrue = entries.some((e) => e.berlaku === true);
    const hasFalse = entries.some((e) => e.berlaku === false);
    if (hasTrue && hasFalse) {
      console.log(`⚠️ KONFLIK BERLAKU pada ${key}:`, entries);
      conflictCount++;
    }
  }

  if (conflictCount === 0) {
    console.log('✅ Tidak ada konflik nilai `berlaku` (tidak ada kasus di mana salinan A bernilai TRUE dan salinan B bernilai FALSE untuk UPT yang sama).');
  }

  // -------------------------------------------------------------
  // POIN 4: CEK max_ref_node_id
  // -------------------------------------------------------------
  console.log('\n--- POIN 4: CEK max_ref_node_id ---');
  const nodesWithMaxRef = nodes.filter((n) => n.max_ref_node_id);
  console.log(`Jumlah node dengan max_ref_node_id: ${nodesWithMaxRef.length}`);

  for (const n of nodesWithMaxRef) {
    const refNode = nodeMap.get(n.max_ref_node_id!);
    const myRootIka = getRootIkaId(n.id);
    const refRootIka = refNode ? getRootIkaId(refNode.id) : null;
    const isSameTree = myRootIka === refRootIka;

    console.log(
      ` - Node: [${n.kode}] ${n.nama.slice(0, 35)}... (Pohon: ${myRootIka?.slice(0, 8)}) -> Ref: [${refNode?.kode}] ${refNode?.nama.slice(0, 35)}... (Pohon: ${refRootIka?.slice(0, 8)}) | Same Tree? ${isSameTree ? '✅ YA' : '❌ BEDA POHON'}`
    );
  }

  // -------------------------------------------------------------
  // POIN 5: CEK target_tahunan
  // -------------------------------------------------------------
  console.log('\n--- POIN 5: CEK target_tahunan ---');
  console.log(`Total baris di target_tahunan: ${targetTahunan?.length || 0}`);
  if (targetTahunan && targetTahunan.length > 0) {
    for (const t of targetTahunan) {
      const node = nodeMap.get(t.node_id);
      const rootIka = node ? getRootIkaId(node.id) : null;
      console.log(` - Target Node: ${t.node_id.slice(0, 8)} (${node?.kode} - ${node?.nama}) | Tahun: ${t.tahun} | Target: ${t.target} | Root IKA: ${rootIka?.slice(0, 8)}`);
    }
  }

  // -------------------------------------------------------------
  // POIN 10: BANDINGKAN 113 LEAF DENGAN kamus_data_leaf_node_ika.csv (184 baris)
  // -------------------------------------------------------------
  console.log('\n--- POIN 10: PERBANDINGAN 113 LEAF DB DENGAN kamus_data_leaf_node_ika.csv ---');
  const csvPath = path.resolve(process.cwd(), 'kamus_data_leaf_node_ika.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvLines = csvContent.split('\n').filter((l) => l.trim().length > 0);
  console.log(`Total baris di CSV (termasuk header): ${csvLines.length}`);

  // Parse CSV secara sederhana
  // Header: ika,kode,nama,tipe_input,bobot,min,max,max_dinamis,cap_100,catatan,baris_excel
  const csvRows: any[] = [];
  for (let i = 1; i < csvLines.length; i++) {
    const line = csvLines[i];
    // Simple split respecting basic quotes
    const parts = line.split(',');
    const ika = parts[0]?.trim();
    const tipeInput = parts[3]?.trim();
    csvRows.push({ lineNum: i + 1, raw: line, ika, tipeInput });
  }

  // Kelompokkan per IKA di CSV
  const csvCountByIka: Record<string, number> = {};
  const csvLeavesByIka: Record<string, number> = {};
  csvRows.forEach((r) => {
    if (r.ika) {
      csvCountByIka[r.ika] = (csvCountByIka[r.ika] || 0) + 1;
      // Di CSV, tipe_input = ANGKA atau PREDIKAT adalah leaf input
      if (r.tipeInput === 'ANGKA' || r.tipeInput === 'PREDIKAT') {
        csvLeavesByIka[r.ika] = (csvLeavesByIka[r.ika] || 0) + 1;
      }
    }
  });

  console.log('Distribusi Baris di CSV:');
  console.log(' - Total baris ber-IKA:', Object.values(csvCountByIka).reduce((a, b) => a + b, 0));
  console.log(' - Total baris bertipe ANGKA/PREDIKAT (Leaf) di CSV:', Object.values(csvLeavesByIka).reduce((a, b) => a + b, 0));
  for (const ika of ikas) {
    console.log(`   * ${ika}: Total baris CSV = ${csvCountByIka[ika] || 0} | Leaf input (ANGKA/PREDIKAT) = ${csvLeavesByIka[ika] || 0}`);
  }

  // Khusus IKA.02 (mengapa 45 leaf di DB?)
  console.log('\nAnalisis IKA.02 (45 leaf di DB):');
  const ika02Tree = nodes.filter((n) => getRootIkaId(n.id) === 'f500562d');
  const ika02Leaves = ika02Tree.filter((n) => n.level === 'LEAF');
  console.log(` - Salinan kanonik IKA.02 punya ${ika02Leaves.length} leaf node.`);
  console.log(` - Komponen di IKA.02:`, ika02Tree.filter(n => n.level === 'KOMPONEN').map(n => `${n.kode} (${n.nama})`));
  // Cetak rincian per komponen IKA.02
  for (const comp of ika02Tree.filter(n => n.level === 'KOMPONEN')) {
    const compLeaves = ika02Leaves.filter(l => {
      let p: any = nodeMap.get(l.parent_id || '');
      while (p) {
        if (p.id === comp.id) return true;
        p = nodeMap.get(p.parent_id || '');
      }
      return false;
    });
    console.log(`   * Komponen ${comp.kode}: ${compLeaves.length} leaf node`);
  }
}

deepDiagnose().catch(console.error);
