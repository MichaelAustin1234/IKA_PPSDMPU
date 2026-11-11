import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as unknown as { WebSocket: typeof WebSocket }).WebSocket = WebSocket;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hpegzhzxzqzyrvhhfsoa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwZWd6aHp4enF6eXJ2aGhmc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTE3ODg2NCwiZXhwIjoyMTA2NzU0ODY0fQ.RH-E-Izz12AO7bXxjvWiugbYQxEaIa3CZrRFfei2YBs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPathMapping() {
  const { data: nodes } = await supabase.from('indikator_node').select('id, parent_id, kode, level, nama');
  if (!nodes) return;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

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

  const paths = nodes.map(n => ({ id: n.id, kode: n.kode, level: n.level, path: getPath(n.id) }));

  const canonicalSkaIds = new Set([
    'a7d0d42f-8da7-4e94-9136-19f860579e0a',
    '375be678-3927-4688-857d-fdc9e88a1d35',
    'd8ebb3d4-a505-49ce-897f-ca5508d559bb',
    '27d927d4-4e83-41b0-99ef-50084284cbfc',
    'f37f88f6-97d6-44bd-96a7-576e2deb24ae',
    '5df2620a-1eee-4b97-bcee-fc55b24a35d5',
  ]);

  // Recursively collect all canonical nodes
  const canonicalIds = new Set<string>();
  function addChildren(id: string) {
    canonicalIds.add(id);
    const children = nodes!.filter(n => n.parent_id === id);
    children.forEach(c => addChildren(c.id));
  }
  canonicalSkaIds.forEach(id => addChildren(id));

  console.log(`Total canonical nodes: ${canonicalIds.size}`);
  console.log(`Total duplicate nodes to delete: ${nodes.length - canonicalIds.size}`);

  const canonicalPaths = paths.filter(p => canonicalIds.has(p.id));
  const duplicatePaths = paths.filter(p => !canonicalIds.has(p.id));

  const canonicalPathMap = new Map<string, string>();
  canonicalPaths.forEach(cp => {
    canonicalPathMap.set(cp.path, cp.id);
  });

  let mappedCount = 0;
  let unmappedCount = 0;
  const unmapped: any[] = [];

  duplicatePaths.forEach(dp => {
    const canId = canonicalPathMap.get(dp.path);
    if (canId) {
      mappedCount++;
    } else {
      unmappedCount++;
      unmapped.push(dp);
    }
  });

  console.log(`Mapped duplicate nodes by path: ${mappedCount}`);
  console.log(`Unmapped duplicate nodes: ${unmappedCount}`);
  if (unmapped.length > 0) {
    console.log('Unmapped duplicates:', unmapped);
  }
}

testPathMapping().catch(console.error);
