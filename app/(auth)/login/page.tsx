'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ika/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState('2026-Q2');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message === 'Invalid login credentials'
          ? 'Email atau kata sandi tidak sesuai.'
          : error.message);
        return;
      }

      // Simpan periode aktif ke Cookie & LocalStorage
      document.cookie = `active_periode=${selectedPeriode}; path=/; max-age=604800; SameSite=Lax`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('active_periode', selectedPeriode);
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle showLabel />
      </div>
      <div className="w-full max-w-md">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
            IKA
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sistem Informasi IKA
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pusat Pengembangan SDM Perhubungan Udara (PPSDMPU)
          </p>
        </div>

        {/* Card Form */}
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-6">
            Masuk ke Akun Anda
          </h2>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Alamat Email Kedinasan
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@kemenhub.go.id"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Kata Sandi
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="periode"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Sesi Periode Pelaporan
                </label>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                  Kuartal Aktif
                </span>
              </div>
              <select
                id="periode"
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium transition-all"
              >
                <option value="2026-Q2">Tahun 2026 - Triwulan 2 (BUKA)</option>
                <option value="2026-Q1">Tahun 2026 - Triwulan 1 (TUTUP)</option>
                <option value="2026-Q3">Tahun 2026 - Triwulan 3 (TUTUP)</option>
                <option value="2026-Q4">Tahun 2026 - Triwulan 4 (TUTUP)</option>
              </select>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Aplikasi otomatis membuka dan memonitor data pada triwulan ini.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Akses terbatas untuk Admin 8 UPT, Super Admin Pusat, dan Pimpinan PPSDMPU.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
