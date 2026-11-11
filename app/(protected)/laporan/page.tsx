import { cookies } from 'next/headers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { LaporanListView } from '@/components/ika/LaporanListView';
import type { Laporan, Periode, Profile } from '@/lib/types';
import { redirect } from 'next/navigation';

export default async function LaporanPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const cookieStore = await cookies();
  const activePeriodeKey = cookieStore.get('active_periode')?.value || '2026-Q2';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, upt:upt_id(*)')
    .eq('id', user.id)
    .single();

  const isSuperOrPimpinan = profileData?.role === 'SUPER_ADMIN' || profileData?.role === 'PIMPINAN';

  const [{ data: laporanData }, { data: periodeData }] = await Promise.all([
    (isSuperOrPimpinan ? adminClient : supabase)
      .from('laporan')
      .select('*, upt:upt_id(*)')
      .order('submitted_at', { ascending: false }),
    adminClient.from('periode').select('*').order('tahun').order('triwulan'),
  ]);

  const laporanList = (laporanData as Laporan[]) || [];
  const periodeList = (periodeData as Periode[]) || [];
  const currentProfile: Profile = profileData
    ? {
        id: profileData.id,
        nama: profileData.nama,
        role: profileData.role,
        upt_id: profileData.upt_id,
        upt: profileData.upt ?? undefined,
      }
    : {
        id: user.id,
        nama: user.email?.split('@')[0] || 'User',
        role: 'PIMPINAN',
        upt_id: null,
      };

  return (
    <LaporanListView
      laporanList={laporanList}
      periodeList={periodeList}
      currentProfile={currentProfile}
      activePeriodeKey={activePeriodeKey}
    />
  );
}
