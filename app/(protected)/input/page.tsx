import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function InputIndexPage() {
  const cookieStore = await cookies();
  const activePeriode = cookieStore.get('active_periode')?.value || '2026-Q2';
  redirect(`/input/${activePeriode}`);
}
