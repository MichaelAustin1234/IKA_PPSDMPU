import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/ika/AppShell';
import type { Profile } from '@/lib/types';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const activePeriode = cookieStore.get('active_periode')?.value || '2026-Q2';

  // Ambil profil user beserta relasi UPT
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, upt:upt_id(*)')
    .eq('id', user.id)
    .single();

  const profile: Profile | null = profileData
    ? {
        id: profileData.id,
        nama: profileData.nama,
        role: profileData.role,
        upt_id: profileData.upt_id,
        upt: profileData.upt ?? undefined,
      }
    : {
        id: user.id,
        nama: user.email?.split('@')[0] ?? 'Pengguna',
        role: 'PIMPINAN',
        upt_id: null,
      };

  return (
    <AppShell profile={profile} activePeriode={activePeriode}>
      {children}
    </AppShell>
  );
}
