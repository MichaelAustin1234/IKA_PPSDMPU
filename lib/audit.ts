// lib/audit.ts
import { createAdminClient } from '@/lib/supabase/server';
import type { UserRole, AuditAction } from '@/lib/types';

export interface LogAuditParams {
  userId?: string | null;
  userEmail: string;
  userNama: string;
  role: UserRole;
  action: AuditAction | string;
  targetType?: string;
  targetId?: string;
  keterangan: string;
  detail?: Record<string, unknown>;
}

export async function recordAuditLog(params: LogAuditParams) {
  try {
    const adminClient = createAdminClient();
    await adminClient.from('audit_log').insert({
      user_id: params.userId || null,
      user_email: params.userEmail,
      user_nama: params.userNama,
      role: params.role,
      action: params.action,
      target_type: params.targetType || null,
      target_id: params.targetId || null,
      keterangan: params.keterangan,
      detail: params.detail || null,
    });
  } catch (err) {
    console.warn('Gagal mencatat audit log:', err);
  }
}
