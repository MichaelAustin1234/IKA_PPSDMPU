import { createClient } from '@/lib/supabase/server';
import { TreeViewer } from '@/components/ika/TreeViewer';
import type { IndikatorNode } from '@/lib/types';

export default async function IndicatorsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('indikator_node')
    .select('*')
    .order('urutan');

  const nodes = (data as IndikatorNode[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Kamus & Pohon Indikator
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Daftar hierarki seluruh Sasaran Strategis, IKA, Komponen, dan Leaf Node sistem IKA
        </p>
      </div>

      <TreeViewer nodes={nodes} />
    </div>
  );
}
