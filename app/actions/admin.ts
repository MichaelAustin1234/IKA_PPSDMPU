'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifySuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Tidak terautentikasi');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'SUPER_ADMIN') {
    throw new Error('Akses ditolak: Hanya Super Admin yang diizinkan');
  }

  return user;
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  try {
    await verifySuperAdmin();

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Kata sandi minimal 6 karakter' };
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/users');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return { success: false, error: message };
  }
}

export async function togglePeriodeStatusAction(
  periodeId: string,
  newStatus: 'BUKA' | 'TUTUP'
) {
  try {
    await verifySuperAdmin();

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('periode')
      .update({ status: newStatus })
      .eq('id', periodeId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/periode');
    revalidatePath('/login');
    revalidatePath('/laporan');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return { success: false, error: message };
  }
}

export async function createPeriodeAction(
  tahun: number,
  triwulan: number,
  status: 'BUKA' | 'TUTUP'
) {
  try {
    await verifySuperAdmin();

    const adminClient = createAdminClient();
    const { error } = await adminClient.from('periode').insert({
      tahun,
      triwulan,
      status,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/periode');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return { success: false, error: message };
  }
}
