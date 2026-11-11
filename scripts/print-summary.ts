import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts', 'matrix-results.json'), 'utf-8'));
const { matrixByIka, leavesWithoutUptList } = data;

console.log('=== RINGKASAN COVERAGE UPT PER IKA SETELAH UNION ===\n');

for (const [ika, leaves] of Object.entries(matrixByIka) as [string, any[]][]) {
  console.log(`\n---------------------------------------------------------`);
  console.log(`IKA: ${ika} (${leaves.length} Leaf Nodes)`);
  console.log(`---------------------------------------------------------`);
  
  // Hitung UPT yang berlaku per leaf
  const uptSummaryMap = new Map<string, number>();
  leaves.forEach(l => {
    const uptStr = l.upts.length > 0 ? l.upts.sort().join(', ') : '(TIDAK ADA / N/A)';
    uptSummaryMap.set(uptStr, (uptSummaryMap.get(uptStr) || 0) + 1);
  });

  for (const [uptGroup, count] of uptSummaryMap.entries()) {
    console.log(`  - [${count} leaf] berlaku untuk: ${uptGroup}`);
  }
}

console.log(`\n\n=== DAFTAR LEAF TANPA BARIS NODE_UPT SAMA SEKALI (${leavesWithoutUptList.length} LEAF) ===`);
leavesWithoutUptList.forEach((l: any, i: number) => {
  console.log(`${i + 1}. [${l.kode}] ${l.nama} (Path: ${l.path})`);
});
