'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getDaftarPeriodeAction } from '@/app/actions/laporan';
import {
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Calendar,
  ShieldCheck,
  Layers,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ika/ThemeToggle';

interface PeriodeItem {
  id: string;
  tahun: number;
  triwulan: number;
  status: 'BUKA' | 'TUTUP';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Helper penentu triwulan kalender saat ini
  const now = new Date();
  const currentCalendarYear = now.getFullYear();
  const currentCalendarQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentCalendarKey = `${currentCalendarYear}-Q${currentCalendarQuarter}`;

  const [selectedPeriode, setSelectedPeriode] = useState(currentCalendarKey);
  const [periodeList, setPeriodeList] = useState<PeriodeItem[]>([
    { id: '4', tahun: 2026, triwulan: 4, status: 'BUKA' },
    { id: '3', tahun: 2026, triwulan: 3, status: 'TUTUP' },
    { id: '2', tahun: 2026, triwulan: 2, status: 'TUTUP' },
    { id: '1', tahun: 2026, triwulan: 1, status: 'TUTUP' },
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ambil daftar periode dari database secara real-time
  useEffect(() => {
    async function loadPeriodes() {
      const res = await getDaftarPeriodeAction();
      if (res.success && res.data.length > 0) {
        setPeriodeList(res.data as PeriodeItem[]);

        const calendarMatch = res.data.find(
          (p) => `${p.tahun}-Q${p.triwulan}` === currentCalendarKey
        );

        if (calendarMatch) {
          setSelectedPeriode(currentCalendarKey);
        } else {
          const periodeBuka = res.data.find((p) => p.status === 'BUKA');
          if (periodeBuka) {
            setSelectedPeriode(`${periodeBuka.tahun}-Q${periodeBuka.triwulan}`);
          } else {
            const latest = res.data[0];
            setSelectedPeriode(`${latest.tahun}-Q${latest.triwulan}`);
          }
        }
      }
    }
    loadPeriodes();
  }, [currentCalendarKey]);

  const activePeriodeData = periodeList.find(
    (p) => `${p.tahun}-Q${p.triwulan}` === selectedPeriode
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Email kedinasan atau kata sandi tidak sesuai.'
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
      setErrorMsg('Terjadi kendala jaringan saat menghubungi server. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full overflow-hidden flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 select-none">
      {/* ============================================================== */}
      {/* PANEL KIRI: HERO BRANDING RESMI KEDINASAN (Desktop >= lg)      */}
      {/* ============================================================== */}
      <section className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative flex-col justify-between p-8 xl:p-12 overflow-hidden bg-slate-950 text-white h-full">
        {/* Foto Gedung Background dengan Gradient Overlay Lembut */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/gedung.png"
            alt="Gedung Pusat Pengembangan SDM Perhubungan Udara"
            fill
            priority
            className="object-cover object-center opacity-45 dark:opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-indigo-950/60" />
          {/* Subtle Grid Accent */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* Top: Logo & Nama Kementerian */}
        <div className="relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xs">
              <div className="w-9 h-9 relative flex items-center justify-center p-0.5 rounded-xl bg-white">
                <Image
                  src="/logo-kemenhub.png"
                  alt="Logo Kemenhub"
                  width={30}
                  height={30}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="w-9 h-9 relative flex items-center justify-center p-0.5 rounded-xl bg-white">
                <Image
                  src="/logo-ppsdmpu.png"
                  alt="Logo PPSDMPU"
                  width={30}
                  height={30}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="border-l border-white/20 pl-3">
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-200">
                Kementerian Perhubungan RI
              </p>
              <p className="text-[11px] font-medium text-slate-400">
                Badan Pengembangan SDM Perhubungan
              </p>
            </div>
          </div>
        </div>

        {/* Center: Headline & Keunggulan Sistem */}
        <div className="relative z-10 max-w-xl my-auto py-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-semibold mb-3 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Informasi Capaian Kinerja Antara (IKA)
          </div>

          <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight mb-2.5">
            Pengukuran & Monitoring Kinerja Antara PPSDMPU
          </h1>

          <p className="text-xs xl:text-sm text-slate-300 leading-relaxed mb-5">
            Platform digital terintegrasi untuk pelaporan, normalisasi data, dan kalkulasi otomatis 6 Indikator Kinerja Antara (IKA) bagi 8 UPT Pendidikan & Pelatihan Perhubungan Udara.
          </p>

          {/* 3 Value Highlights */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 backdrop-blur-xs border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Hierarki Pohon Indikator Dinamis</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Mendukung kedalaman bertingkat (SKA → IKA → Komponen → Sub → Leaf Node) standar Renstra 2025–2029.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 backdrop-blur-xs border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Integrasi 8 Satker Kampus & Balai</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  PPI Curug, Poltekbang Surabaya, Medan, Makassar, Palembang, Jayapura, API Banyuwangi, dan BP3 Curug.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 backdrop-blur-xs border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Kalkulasi Otomatis & Akuntabel</h4>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Snapshot hasil hitung otomatis saat submit dengan formula terverifikasi, bebas deviasi manual.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Hak Cipta & Info PPSDMPU */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <p>© 2026 Pusat Pengembangan SDM Perhubungan Udara</p>
          <span className="font-mono text-[10px] text-slate-400">Versi 1.0</span>
        </div>
      </section>

      {/* ============================================================== */}
      {/* PANEL KANAN: FORMULIR AUTENTIKASI PENGGUNA                     */}
      {/* ============================================================== */}
      <section className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-between p-6 sm:p-8 lg:p-8 xl:p-10 relative bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 h-full overflow-y-auto lg:overflow-hidden">
        {/* Top Bar Form Panel */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          {/* Logo Mobile Only */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 relative flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <Image
                src="/logo-kemenhub.png"
                alt="Logo Kemenhub"
                width={26}
                height={26}
                className="object-contain"
              />
            </div>
            <div className="w-8 h-8 relative flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <Image
                src="/logo-ppsdmpu.png"
                alt="Logo PPSDMPU"
                width={26}
                height={26}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">IKA PPSDMPU</p>
              <p className="text-[10px] text-slate-500">Portal Kinerja Antara</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Sistem Kinerja Antara
            </span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle showLabel className="shadow-2xs" />
        </div>

        {/* Center: Card Formulir */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-2">
          <div className="mb-4 text-left">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gunakan alamat email resmi kedinasan untuk mengakses portal.
            </p>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="mb-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            {/* Input Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Alamat Email Kedinasan
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.upt@ppsdmpu.go.id"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Select Sesi Periode */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="periode"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Sesi Periode Pelaporan
                </label>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    activePeriodeData?.status === 'BUKA'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {activePeriodeData?.status === 'BUKA' ? 'Triwulan Terbuka' : 'Triwulan Ditutup'}
                </span>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Calendar className="w-4 h-4" />
                </div>
                <select
                  id="periode"
                  value={selectedPeriode}
                  onChange={(e) => setSelectedPeriode(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium transition-all cursor-pointer"
                >
                  {periodeList.map((p) => (
                    <option key={p.id} value={`${p.tahun}-Q${p.triwulan}`}>
                      Tahun {p.tahun} — Triwulan {p.triwulan} ({p.status})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1">
                Default: TW aktif saat ini. Anda dapat memilih triwulan lampau untuk melihat arsip data.
              </p>
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Sistem</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Card */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-[10.5px]">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Akses resmi untuk Admin 8 UPT, Admin Pusat, Super Admin, dan Pimpinan.</span>
            </div>
          </div>
        </div>

        {/* Bottom Help Desk */}
        <div className="text-center pt-2 text-[10.5px] text-slate-400 dark:text-slate-500 shrink-0">
          Mengalami kendala akun? Hubungi Administrator Sistem PPSDMPU.
        </div>
      </section>
    </div>
  );
}
