'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ika/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Email atau kata sandi tidak sesuai.'
            : error.message
        );
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      {/* Background Image Gedung dengan Blur & Overlay Gradien */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/gedung.png"
          alt="Gedung PPSDMPU"
          fill
          priority
          className="object-cover object-center scale-105 filter blur-sm opacity-40 dark:opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/60" />
      </div>

      {/* Theme Toggle di Pojok Kanan Atas */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle showLabel className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md" />
      </div>

      {/* Card Kontainer Utama */}
      <div className="w-full max-w-md relative z-10 my-8">
        {/* Header Logo Kemenhub & PPSDMPU */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-14 h-14 relative p-1 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center">
              <Image
                src="/logo-kemenhub.png"
                alt="Logo Kementerian Perhubungan"
                width={46}
                height={46}
                className="object-contain"
                priority
              />
            </div>
            <div className="w-14 h-14 relative p-1 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center">
              <Image
                src="/logo-ppsdmpu.png"
                alt="Logo PPSDMPU"
                width={46}
                height={46}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
            Sistem Informasi IKA
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1 drop-shadow-xs max-w-xs mx-auto">
            Pusat Pengembangan SDM Perhubungan Udara (PPSDMPU)
          </p>
        </div>

        {/* Card Form Glassmorphism */}
        <div className="p-7 md:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Masuk ke Akun Anda
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gunakan kredensial resmi kedinasan
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              PORTAL IKA
            </span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
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
                placeholder="admin.upt@ppsdmpu.go.id"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="periode"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Sesi Periode Pelaporan
                </label>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                  Kuartal Aktif
                </span>
              </div>
              <select
                id="periode"
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium transition-all"
              >
                <option value="2026-Q2">Tahun 2026 - Triwulan 2 (BUKA)</option>
                <option value="2026-Q1">Tahun 2026 - Triwulan 1 (TUTUP)</option>
                <option value="2026-Q3">Tahun 2026 - Triwulan 3 (TUTUP)</option>
                <option value="2026-Q4">Tahun 2026 - Triwulan 4 (TUTUP)</option>
              </select>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Aplikasi otomatis memonitor capaian triwulan yang Anda pilih.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer"
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

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/70 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Akses terbatas untuk Admin 8 UPT, Super Admin Pusat, dan Pimpinan PPSDMPU.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

