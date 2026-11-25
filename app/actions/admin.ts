'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { recordAuditLog } from '@/lib/audit';

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
    .select('nama, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'SUPER_ADMIN') {
    throw new Error('Akses ditolak: Hanya Super Admin yang diizinkan');
  }

  return { user, profile };
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  try {
    const { user, profile } = await verifySuperAdmin();

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Kata sandi minimal 6 karakter' };
    }

    const adminClient = createAdminClient();
    const { data: targetUser } = await adminClient.auth.admin.getUserById(userId);

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    await recordAuditLog({
      userId: user.id,
      userEmail: user.email || '',
      userNama: profile.nama,
      role: 'SUPER_ADMIN',
      action: 'RESET_PASSWORD',
      targetType: 'USER',
      targetId: userId,
      keterangan: `Super Admin mereset kata sandi akun ${targetUser?.user?.email || userId}`,
      detail: { targetUserId: userId, targetEmail: targetUser?.user?.email },
    });

    revalidatePath('/users');
    revalidatePath('/audit-log');
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
    const { user, profile } = await verifySuperAdmin();

    const adminClient = createAdminClient();
    const { data: existingPeriode } = await adminClient
      .from('periode')
      .select('*')
      .eq('id', periodeId)
      .single();

    const { error } = await adminClient
      .from('periode')
      .update({ status: newStatus })
      .eq('id', periodeId);

    if (error) {
      return { success: false, error: error.message };
    }

    const desc = existingPeriode
      ? `Tahun ${existingPeriode.tahun} TW ${existingPeriode.triwulan}`
      : `ID ${periodeId}`;

    await recordAuditLog({
      userId: user.id,
      userEmail: user.email || '',
      userNama: profile.nama,
      role: 'SUPER_ADMIN',
      action: newStatus === 'BUKA' ? 'BUKA_PERIODE' : 'TUTUP_PERIODE',
      targetType: 'PERIODE',
      targetId: periodeId,
      keterangan: `Super Admin mengubah status masa pengisian ${desc} menjadi ${newStatus}`,
      detail: { periodeId, oldStatus: existingPeriode?.status, newStatus },
    });

    revalidatePath('/periode');
    revalidatePath('/login');
    revalidatePath('/laporan');
    revalidatePath('/audit-log');
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
    const { user, profile } = await verifySuperAdmin();

    const adminClient = createAdminClient();
    const { data: newPeriode, error } = await adminClient
      .from('periode')
      .insert({
        tahun,
        triwulan,
        status,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await recordAuditLog({
      userId: user.id,
      userEmail: user.email || '',
      userNama: profile.nama,
      role: 'SUPER_ADMIN',
      action: 'CREATE_PERIODE',
      targetType: 'PERIODE',
      targetId: newPeriode?.id,
      keterangan: `Super Admin menambahkan periode baru Tahun ${tahun} Triwulan ${triwulan} (Status: ${status})`,
      detail: { tahun, triwulan, status },
    });

    revalidatePath('/periode');
    revalidatePath('/audit-log');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return { success: false, error: message };
  }
}
