import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AuditLogView } from '@/components/ika/AuditLogView';
import type { AuditLog } from '@/lib/types';

export default async function AuditLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verifikasi wewenang: Hanya SUPER_ADMIN yang berhak mengakses Audit Trail
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const adminClient = createAdminClient();
  const { data: logsData, error } = await adminClient
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.warn('Tabel audit_log mungkin belum dibuat di database:', error.message);
  }

  const logs = (logsData as AuditLog[]) || [];

  return <AuditLogView logs={logs} />;
}
