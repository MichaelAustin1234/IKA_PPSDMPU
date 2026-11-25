'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { recordAuditLog } from '@/lib/audit';
import type { UserRole } from '@/lib/types';

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

export interface CreateUserPayload {
  nama: string;
  email: string;
  password: string;
  role: UserRole;
  uptId?: string | null;
}

export interface UpdateUserPayload {
  userId: string;
  nama: string;
  email: string;
  role: UserRole;
  uptId?: string | null;
}

export async function createUserAction(payload: CreateUserPayload) {
  try {
    const { user, profile } = await verifySuperAdmin();

    if (!payload.email || !payload.nama || !payload.password) {
      return { success: false, error: 'Semua kolom wajib diisi.' };
    }

    if (payload.password.length < 6) {
      return { success: false, error: 'Kata sandi minimal 6 karakter.' };
    }

    const adminClient = createAdminClient();

    // 1. Buat user di Supabase Auth
    const { data: newUserRes, error: authErr } = await adminClient.auth.admin.createUser({
      email: payload.email.trim(),
      password: payload.password,
      email_confirm: true,
      user_metadata: { nama: payload.nama.trim() },
    });

    if (authErr) {
      return { success: false, error: authErr.message };
    }

    const newUserId = newUserRes.user.id;

    // 2. Simpan profil ke tabel profiles
    const { error: profileErr } = await adminClient.from('profiles').upsert({
      id: newUserId,
      nama: payload.nama.trim(),
      role: payload.role,
      upt_id: payload.role === 'ADMIN_UPT' ? (payload.uptId || null) : null,
    });

    if (profileErr) {
      await adminClient.auth.admin.deleteUser(newUserId);
      return { success: false, error: profileErr.message };
    }

    // 3. Catat audit log
    await recordAuditLog({
      userId: user.id,
      userEmail: user.email || '',
      userNama: profile.nama,
      role: 'SUPER_ADMIN',
      action: 'CREATE_USER',
      targetType: 'USER',
      targetId: newUserId,
      keterangan: `Super Admin membuat akun pengguna baru ${payload.email} (${payload.role})`,
      detail: { email: payload.email, role: payload.role, uptId: payload.uptId },
    });

    revalidatePath('/users');
    revalidatePath('/audit-log');
    return { success: true, userId: newUserId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return { success: false, error: message };
  }
}

export async function updateUserAction(payload: UpdateUserPayload) {
  try {
    const { user, profile } = await verifySuperAdmin();

    if (!payload.email || !payload.nama) {
      return { success: false, error: 'Nama dan Email wajib diisi.' };
    }

    const adminClient = createAdminClient();

    // 1. Update email di Supabase Auth jika berubah
    const { data: existingUser } = await adminClient.auth.admin.getUserById(payload.userId);
    if (existingUser?.user?.email !== payload.email.trim()) {
      const { error: authErr } = await adminClient.auth.admin.updateUserById(payload.userId, {
        email: payload.email.trim(),
        email_confirm: true,
      });
      if (authErr) {
        return { success: false, error: authErr.message };
      }
    }

    // 2. Update profiles
    const { error: profErr } = await adminClient
      .from('profiles')
      .update({
        nama: payload.nama.trim(),
        role: payload.role,
        upt_id: payload.role === 'ADMIN_UPT' ? (payload.uptId || null) : null,
      })
      .eq('id', payload.userId);

    if (profErr) {
      return { success: false, error: profErr.message };
    }

    // 3. Catat audit log
    await recordAuditLog({
      userId: user.id,
      userEmail: user.email || '',
      userNama: profile.nama,
      role: 'SUPER_ADMIN',
      action: 'UPDATE_USER',
      targetType: 'USER',
      targetId: payload.userId,
      keterangan: `Super Admin memperbarui data akun ${payload.email} (${payload.role})`,
      detail: { email: payload.email, role: payload.role, uptId: payload.uptId },
    });

    revalidatePath('/users');
    revalidatePath('/audit-log');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return { success: false, error: message };
  }
}

export async function deleteUserAction(targetUserId: string) {
  try {
    const { user, profile } = await verifySuperAdmin();

    if (user.id === targetUserId) {
      return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' };
    }

    const adminClient = createAdminClient();
    const { data: targetUser } = await adminClient.auth.admin.getUserById(targetUserId);
    const targetEmail = targetUser?.user?.email || targetUserId;

    // 1. Hapus dari tabel profiles
    await adminClient.from('profiles').delete().eq('id', targetUserId);

    // 2. Hapus dari Supabase Auth
    const { error: authErr } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (authErr) {
      return { success: false, error: authErr.message };
    }

    // 3. Catat audit log
    await recordAuditLog({
      userId: user.id,
      userEmail: user.email || '',
      userNama: profile.nama,
      role: 'SUPER_ADMIN',
      action: 'DELETE_USER',
      targetType: 'USER',
      targetId: targetUserId,
      keterangan: `Super Admin menghapus akun pengguna ${targetEmail}`,
      detail: { deletedUserId: targetUserId, email: targetEmail },
    });

    revalidatePath('/users');
    revalidatePath('/audit-log');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
    return { success: false, error: message };
  }
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
