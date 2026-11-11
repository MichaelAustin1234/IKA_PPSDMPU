import fs from 'fs';
(globalThis as any).WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// load env
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq > 0) env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: nodes } = await supabase.from('indikator_node').select('id, kode, nama, level, tipe_input, catatan');
  const { data: nus } = await supabase.from('node_upt').select('node_id, upt_id, berlaku');
  const { data: upts } = await supabase.from('upt').select('id, kode');
  
  const uptMap = new Map(upts.map((u: any) => [u.id, u.kode]));
  const nodeMap = new Map<string, any>(nodes.map((n: any) => [n.id, n]));

  // 1.7 Level count
  const levelCount = nodes.reduce((acc: any, cur: any) => { acc[cur.level] = (acc[cur.level] || 0) + 1; return acc; }, {});
  console.log('LEVEL_COUNT:', levelCount);

  // node_upt per UPT (berlaku = true)
  const berlakuNus = nus.filter((n: any) => n.berlaku === true);
  const uptNuCount = berlakuNus.reduce((acc: any, cur: any) => {
    const k = uptMap.get(cur.upt_id) || cur.upt_id;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  console.log('NODE_UPT_PER_UPT (berlaku = true):', uptNuCount);

  // butir isian per UPT (tipe_input <> TURUNAN)
  const uptIsianCount = berlakuNus.reduce((acc: any, cur: any) => {
    const node = nodeMap.get(cur.node_id);
    if (node && node.tipe_input !== 'TURUNAN') {
      const k = uptMap.get(cur.upt_id) || cur.upt_id;
      acc[k] = (acc[k] || 0) + 1;
    }
    return acc;
  }, {});
  console.log('BUTIR_ISIAN_PER_UPT (tipe_input <> TURUNAN):', uptIsianCount);

  // 1.8 Butir bertipe TURUNAN
  const turunanNodes = nodes.filter((n: any) => n.tipe_input === 'TURUNAN');
  console.log('\n--- BUTIR TURUNAN (Total:', turunanNodes.length, ') ---');
  turunanNodes.forEach((t: any) => {
    const associatedUpts = nus.filter((nu: any) => nu.node_id === t.id && nu.berlaku === true).map((nu: any) => uptMap.get(nu.upt_id));
    console.log(`[${t.level}] ${t.kode} - ${t.nama} | Catatan: ${t.catatan || '-'} | UPTs: ${associatedUpts.join(', ') || 'NONE'}`);
  });

  // 1.9 Butir bertipe PREDIKAT
  const predikatNodes = nodes.filter((n: any) => n.tipe_input === 'PREDIKAT');
  console.log('\n--- BUTIR PREDIKAT (Total:', predikatNodes.length, ') ---');
  predikatNodes.forEach((p: any) => {
    console.log(`[${p.level}] ${p.kode} - ${p.nama}`);
  });

  // 1.10 Cek kolom kode_api
  const { data: sampleNode } = await supabase.from('indikator_node').select('*').limit(1);
  console.log('\nSample indikator_node columns:', Object.keys(sampleNode[0]));
}

main().catch(console.error);

