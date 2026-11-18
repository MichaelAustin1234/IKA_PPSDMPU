import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { UserManagerView, type AdminUserItem } from '@/components/ika/UserManagerView';
import type { UserRole } from '@/lib/types';

export default async function UsersPage() {
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

  // Ambil daftar auth users dan profiles
  const [{ data: authUsersRes }, { data: profilesData }] = await Promise.all([
    adminClient.auth.admin.listUsers(),
    adminClient.from('profiles').select('*, upt:upt_id(*)'),
  ]);

  const authUsers = authUsersRes?.users || [];
  const profileMap = new Map((profilesData || []).map((p) => [p.id, p]));

  const usersList: AdminUserItem[] = authUsers.map((u) => {
    const prof = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email || '-',
      nama: prof?.nama || u.email?.split('@')[0] || 'Pengguna',
      role: (prof?.role as UserRole) || 'PIMPINAN',
      uptNama: prof?.upt?.nama,
      uptKode: prof?.upt?.kode,
      lastSignInAt: u.last_sign_in_at,
      createdAt: u.created_at,
    };
  });

  // Urutkan: SUPER_ADMIN, ADMIN_PUSAT, PIMPINAN, lalu ADMIN_UPT
  const rolePriority: Record<string, number> = {
    SUPER_ADMIN: 1,
    ADMIN_PUSAT: 2,
    PIMPINAN: 3,
    ADMIN_UPT: 4,
  };

  usersList.sort((a, b) => {
    const pA = rolePriority[a.role] || 99;
    const pB = rolePriority[b.role] || 99;
    if (pA !== pB) return pA - pB;
    return a.nama.localeCompare(b.nama);
  });

  return <UserManagerView users={usersList} />;
}
