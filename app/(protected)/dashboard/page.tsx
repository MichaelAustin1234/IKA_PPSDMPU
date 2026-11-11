import { cookies } from 'next/headers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { DashboardView } from '@/components/ika/DashboardView';
import type { Upt, Periode, Profile } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const cookieStore = await cookies();
  const activePeriodeKey = cookieStore.get('active_periode')?.value || '2026-Q2';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch data master UPT dan Periode
  const [{ data: uptData }, { data: periodeData }, { data: profileData }] =
    await Promise.all([
      adminClient.from('upt').select('*').order('kode'),
      adminClient.from('periode').select('*').order('tahun').order('triwulan'),
      user
        ? supabase.from('profiles').select('*, upt:upt_id(*)').eq('id', user.id).single()
        : Promise.resolve({ data: null }),
    ]);

  const uptList: Upt[] = (uptData as Upt[]) || [];
  const periodeList: Periode[] = (periodeData as Periode[]) || [];
  const currentProfile: Profile = profileData
    ? {
        id: profileData.id,
        nama: profileData.nama,
        role: profileData.role,
        upt_id: profileData.upt_id,
        upt: profileData.upt ?? undefined,
      }
    : {
        id: user?.id || 'guest',
        nama: user?.email?.split('@')[0] || 'User',
        role: 'PIMPINAN',
        upt_id: null,
      };

  // Ringkasan 6 Indikator Kinerja Antara (IKA)
  // Data awal / default snapshot
  const initialSummary = [
    {
      kode: 'IKA.01',
      nama: 'Indeks Peningkatan SDM Transportasi Udara',
      skor: 87.2,
      bobot: 0.2,
      skorTerbobot: 17.44,
      status: 'MENDEKATI' as const,
    },
    {
      kode: 'IKA.02',
      nama: 'Indeks Akreditasi dan Sertifikasi Lembaga Diklat',
      skor: 82.25,
      bobot: 0.2,
      skorTerbobot: 16.45,
      status: 'MENDEKATI' as const,
    },
    {
      kode: 'IKA.03',
      nama: 'Indeks Kebijakan Pengembangan SDM Transportasi Udara',
      skor: 86.5,
      bobot: 0.15,
      skorTerbobot: 12.98,
      status: 'MENDEKATI' as const,
    },
    {
      kode: 'IKA.04',
      nama: 'Indeks Kualitas Layanan Pendidikan dan Pelatihan SDM',
      skor: 87.5,
      bobot: 0.15,
      skorTerbobot: 13.13,
      status: 'MENDEKATI' as const,
    },
    {
      kode: 'IKA.05',
      nama: 'Indeks Profesionalisme ASN',
      skor: 88.5,
      bobot: 0.15,
      skorTerbobot: 13.28,
      status: 'MENDEKATI' as const,
    },
    {
      kode: 'IKA.06',
      nama: 'Indeks Akuntabilitas PPSDMPU / UPT',
      skor: 83.75,
      bobot: 0.15,
      skorTerbobot: 12.56,
      status: 'MENDEKATI' as const,
    },
  ];

  return (
    <DashboardView
      uptList={uptList}
      periodeList={periodeList}
      currentProfile={currentProfile}
      initialSummary={initialSummary}
      activePeriodeKey={activePeriodeKey}
    />
  );
}
