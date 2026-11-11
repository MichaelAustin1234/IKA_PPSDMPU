import { createClient, createAdminClient } from '@/lib/supabase/server';
import { InputFormView } from '@/components/ika/InputFormView';
import type { IndikatorNode, PredikatKonversi, Laporan, Upt, Periode } from '@/lib/types';
import { redirect } from 'next/navigation';

export default async function InputPeriodePage({
  params,
}: {
  params: Promise<{ periode: string }>;
}) {
  const { periode: periodeParam } = await params;
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Parsing parameter periode (format: 2026-Q2 atau id)
  let tahun = 2026;
  let triwulan = 2;
  if (periodeParam.includes('-Q')) {
    const parts = periodeParam.split('-Q');
    tahun = parseInt(parts[0], 10) || 2026;
    triwulan = parseInt(parts[1], 10) || 2;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Ambil data profil & UPT
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, upt:upt_id(*)')
    .eq('id', user.id)
    .single();

  // Pimpinan bersifat read-only
  if (profile?.role === 'PIMPINAN') {
    redirect('/dashboard');
  }

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';
  let upt: Upt | null = profile?.upt ?? null;

  if (isSuperAdmin && !upt) {
    const { data: ppsdmpuUpt } = await adminClient
      .from('upt')
      .select('*')
      .eq('kode', 'PPSDMPU')
      .single();
    upt = ppsdmpuUpt as Upt;
  }

  // Pembagian kewenangan: UPT mengisi IKA.01, 02, 04. Pusat mengisi IKA.03, 05, 06.
  const allowedIkas = isSuperAdmin
    ? ['IKA.03', 'IKA.05', 'IKA.06']
    : ['IKA.01', 'IKA.02', 'IKA.04'];

  // 2. Ambil data periode (menggunakan admin client agar tidak terhalang RLS default)
  // 2. Ambil daftar periode & periode aktif
  const { data: allPeriodes } = await adminClient
    .from('periode')
    .select('*')
    .order('tahun')
    .order('triwulan');

  const periodeList = (allPeriodes as Periode[]) || [];

  let periode = periodeList.find((p) => p.tahun === tahun && p.triwulan === triwulan);
  if (!periode) {
    periode = periodeList.find((p) => p.status === 'BUKA') || periodeList[0];
  }

  if (!periode || !upt) {
    return (
      <div className="p-8 text-center text-slate-500">
        Data periode atau UPT belum tersedia. Silakan hubungi Administrator.
      </div>
    );
  }

  // 3. Ambil whitelist node_upt untuk UPT ini (hanya node yang berlaku = true)
  const { data: nodeUptData } = await adminClient
    .from('node_upt')
    .select('node_id')
    .eq('upt_id', upt.id)
    .eq('berlaku', true);

  const allowedNodeIds = new Set((nodeUptData ?? []).map((nu) => nu.node_id));

  // Ambil seluruh indikator_node untuk mapping hierarki IKA ke leaf nodes
  const { data: allNodesData } = await adminClient
    .from('indikator_node')
    .select('*');

  const allNodes = (allNodesData as IndikatorNode[]) || [];
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  // Ambil leaf nodes yang diinput (ANGKA atau PREDIKAT)
  // DAN terdaftar di whitelist node_upt untuk UPT yang bersangkutan
  const leafNodes = allNodes
    .filter(
      (n) =>
        n.level === 'LEAF' &&
        (n.tipe_input === 'ANGKA' || n.tipe_input === 'PREDIKAT') &&
        allowedNodeIds.has(n.id)
    )
    .map((leaf) => {
      let cur: IndikatorNode | undefined = leaf;
      while (cur && cur.level !== 'IKA' && cur.parent_id) {
        cur = nodeMap.get(cur.parent_id);
      }
      return {
        ...leaf,
        ikaKode: cur?.kode || 'IKA.01',
        ikaNama: cur?.nama || 'Indikator Kinerja Antara',
      };
    })
    .sort((a, b) => {
      if ((a.ikaKode || '') !== (b.ikaKode || '')) {
        return (a.ikaKode || '').localeCompare(b.ikaKode || '');
      }
      return (a.urutan ?? 0) - (b.urutan ?? 0);
    });

  // 4. Ambil konversi predikat
  const { data: predikatData } = await adminClient
    .from('predikat_konversi')
    .select('*')
    .order('skor', { ascending: false });

  const predikatList = (predikatData as PredikatKonversi[]) || [];

  // 5. Cek apakah laporan sudah ada
  const { data: laporanData } = await supabase
    .from('laporan')
    .select('*')
    .eq('upt_id', upt.id)
    .eq('periode_id', periode.id)
    .single();

  const laporan = laporanData as Laporan | null;

  // 6. Ambil nilai yang sudah terisi (jika ada)
  const initialValues: Record<string, { nilai_angka: number | null; predikat_id: string | null }> = {};
  if (laporan) {
    const { data: isiData } = await supabase
      .from('laporan_isi')
      .select('*')
      .eq('laporan_id', laporan.id);

    isiData?.forEach((isi) => {
      initialValues[isi.node_id] = {
        nilai_angka: isi.nilai_angka,
        predikat_id: isi.predikat_id,
      };
    });
  }

  return (
    <InputFormView
      upt={upt}
      periode={periode}
      laporan={laporan}
      leafNodes={leafNodes}
      predikatList={predikatList}
      initialValues={initialValues}
      allowedIkas={allowedIkas}
    />
  );
}
