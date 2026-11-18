import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PeriodeManagerView } from '@/components/ika/PeriodeManagerView';
import type { Periode } from '@/lib/types';

export default async function PeriodePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Cek apakah user adalah SUPER_ADMIN
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const adminClient = createAdminClient();
  const { data: periodesData } = await adminClient
    .from('periode')
    .select('*')
    .order('tahun', { ascending: false })
    .order('triwulan', { ascending: false });

  const periodes = (periodesData as Periode[]) || [];

  return <PeriodeManagerView periodes={periodes} />;
}
