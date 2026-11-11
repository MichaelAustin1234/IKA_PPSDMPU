# AGENTS.md

Panduan ini WAJIB dipatuhi oleh AI agent (Gemini, Claude Code, atau agent lain) setiap kali mengerjakan, menambah fitur, atau memperbaiki bug di project ini. Jika instruksi baru bertentangan dengan file ini, LAPORKAN konfliknya, jangan diam-diam pilih salah satu. Jika ragu, TANYAKAN dulu, jangan menebak.

## 1. Tentang Project

Website **Sistem Informasi Capaian Kinerja Antara (IKA) PPSDMPU** — mengganti pengisian formulir Excel Capkin manual dengan aplikasi yang menghitung skor 6 Indikator Kinerja Antara (IKA) secara otomatis dari data mentah 8 UPT, berdasarkan **Excel Capkin** (source of truth kalkulasi) dan **Renstra PPSDMPU 2025-2029** (landasan definisi dan target tahunan).

- Frontend: **Next.js (App Router)**, TypeScript
- Backend/DB: **Supabase** (PostgreSQL + Auth, RLS wajib aktif)
- Styling: sesuai yang sudah berjalan di project saat ini — JANGAN ganti framework styling tanpa alasan teknis konkret dan konfirmasi eksplisit
- Chart/Visualisasi: **Recharts** — native untuk React, deklaratif, mudah di-debug untuk pengembangan solo
- Hosting: **Vercel**
- User: **3 role** — Admin UPT (8 akun, data-scoped), Super Admin Pusat, Pimpinan (read-only)
- Package manager: **pnpm**

Project ini BUKAN perluasan dari Sistem Monitoring KPI (IKK). Keduanya indikator yang berbeda level (IKA = kinerja antara/program, IKK = kinerja kegiatan) dan boleh berupa aplikasi/database terpisah kecuali diinstruksikan eksplisit untuk digabung.

## 2. KONSEP INTI — WAJIB DIPAHAMI SEBELUM MEMBUAT SKEMA APAPUN

### 2.1 Enam IKA, Berbentuk Pohon Berjenjang — BUKAN Daftar Datar

Berbeda dari IKK (8 indikator datar dengan komponen seragam per tipe), IKA adalah **pohon**: `Sasaran Strategis (SKA) → IKA (6 buah) → Komponen (A, B, C, ...) → Sub-komponen (A.1, A.2, ...) → Leaf node (data mentah)`. Jumlah level dan jumlah anak per node BERBEDA-BEDA antar IKA. JANGAN membuat skema dengan kolom tetap per level — skema WAJIB mendukung kedalaman pohon yang tidak seragam (lihat §5).

Enam IKA (kode WAJIB dipakai apa adanya, jangan generik "IKA.1"):

| Kode | Nama | Bobot top-level |
|---|---|---|
| IKA.01 | Indeks Peningkatan SDM Transportasi Udara | A 0,2 + B 0,2 + C 0,3 + D 0,3 |
| IKA.02 | Indeks Akreditasi dan Sertifikasi Lembaga Pendidikan dan Pelatihan | A 0,3 + B 0,3 + C 0,2 + D 0,2 |
| IKA.03 | Indeks Kebijakan Pengembangan SDM Transportasi Udara | A 0,3 + B 0,3 + C 0,3 + D 0,1 |
| IKA.04 | Indeks Kualitas Layanan Pendidikan dan Pelatihan SDM | A 0,25 + B 0,25 + C 0,25 + D 0,25 |
| IKA.05 | Indeks Profesionalisme ASN | Rata-rata 9 unit, tanpa sub-komponen |
| IKA.06 | Indeks Akuntabilitas PPSDMPU/Politeknik/Akademi/Balai | 4 komponen x 0,25 |

### 2.2 Tipe Leaf Node — JANGAN Perlakukan Semua Sama

- **ANGKA** — input numerik mentah (jumlah lulusan, peserta, dosen, dst). Dinormalisasi lewat rumus di §2.3.
- **PREDIKAT** — input lewat dropdown predikat resmi (Unggul, A, Baik Sekali, B, Baik, C), dikonversi ke skor lewat tabel `predikat_konversi` (Unggul=4, A=3,5, Baik Sekali=3, B=2,5, Baik=2, C=1). JANGAN biarkan field ini jadi input angka bebas.
- **TURUNAN** — nilai dihitung dari IKA lain, BUKAN diinput. Contoh: komponen C pada IKA.03 adalah rata-rata dari 4 skor IKA.01 (kelulusan, sertifikasi, penyerapan, kepuasan), masing-masing bobot 0,25. JANGAN membuat form input untuk node bertipe ini.

### 2.3 Rumus Normalisasi — Cap 100 TIDAK Seragam Antar IKA

Rumus dasar: `Skor = (Nilai - Min) / (Max - Min) x 100`, lalu `Skor Terbobot = Skor x Bobot`. Nilai parent = jumlah skor terbobot anak-anaknya.

PENTING, sudah diverifikasi langsung dari formula Excel: **hanya IKA.01 yang skornya dibatasi maksimal 100** (`IF(skor>100, 100, skor)`). IKA.02, IKA.03, IKA.04, IKA.06 **TIDAK dibatasi** — skor boleh lebih dari 100 jika realisasi melebihi target. JANGAN menyeragamkan cap 100 ke semua IKA tanpa konfirmasi eksplisit ke pengguna, karena ini akan mengubah angka akhir dibanding Excel.

### 2.4 Batas Max Bisa Dinamis, Bukan Selalu Angka Tetap

Sebagian leaf node (contoh: C.1 sampai C.5 pada IKA.01, "Tingkat Penyerapan Lulusan") punya batas Max yang **dihitung dari leaf node lain**, bukan konstanta. Contoh: `Max(C.1) = 75% x Jumlah Lulusan s.d. Tahun t`. Skema WAJIB menyimpan referensi node acuan + persentase untuk kasus ini (lihat `max_ref_node_id`, `max_persen` di §5), bukan hanya kolom `max_nilai` statis.

### 2.5 Bobot Anak WAJIB Total 1,0 — Validasi, Jangan Asumsikan

Setiap kali bobot node diubah (lewat seed atau nanti lewat UI), WAJIB validasi bahwa total bobot semua anak dari satu parent = 1,0. Tolak/tandai error jika tidak. Ini fitur inti, bukan nice-to-have — validasi semacam ini yang tidak ada di Excel asli adalah salah satu alasan utama sistem ini dibangun.

### 2.6 Bug yang Sudah Diketahui di Excel Sumber — JANGAN Diam-diam Direplikasi atau Diperbaiki

Dua formula akreditasi di IKA.02 memakai pola `IF(kondisi, nilai+bonus)` **tanpa cabang ELSE**, sehingga Excel menghasilkan `FALSE` (dibaca sistem sebagai 0) ketika kondisinya tidak terpenuhi:
- **Komponen A (Akreditasi Institusi):** `IF(rata-rata < 3, rata-rata + 1)`. Jika rata-rata akreditasi 7 UPT **≥ 3 (baik)**, hasilnya 0 — bukan 3 atau lebih seperti seharusnya. Ini membalik logika: UPT dengan akreditasi buruk mendapat bonus, UPT dengan akreditasi baik berisiko mendapat skor 0.
- **Komponen B (Akreditasi Program Studi):** `IF(rata-rata < 3,5, rata-rata + 0,5)`. Sudah terjadi di data nyata (Poltekbang Makassar, rata-rata persis 3,5 → hasil 0).

JANGAN mereplikasi bug ini secara diam-diam, dan JANGAN memperbaikinya secara sepihak — WAJIB tandai ke pengguna sebagai keputusan yang perlu dikonfirmasi ke stakeholder sebelum rumus ini di-hardcode ke `lib/ika/calculations.ts`. Katalog lengkap leaf node beserta kedua kasus ini ada di `kamus_data_leaf_node_ika.csv`.

Demikian juga komponen B (Sertifikasi Kompetensi) pada IKA.01: di Excel sumber nilainya **diinput manual**, bukan hasil hitung dari B.1 dan B.2 seperti pola komponen lain. Perlakukan sebagai kondisi khusus yang ditandai, jangan disamakan otomatis dengan pola umum.

## 3. Model Input — TRIWULAN (Bukan Bulanan)

Berbeda dari IKK yang bulanan, IKA diinput dan dilaporkan **per triwulan** (4 kali setahun):

- Kolom WAJIB `tahun` dan `triwulan` (1-4). **DILARANG** membuat kolom `month` untuk entitas laporan IKA.
- Satu `laporan` = satu UPT + satu periode (tahun, triwulan), status `DRAFT → SUBMITTED → APPROVED/REJECTED`.
- Saat `SUBMITTED`, sistem membuat snapshot hasil hitung (`hasil_hitung`) untuk laporan tersebut. Snapshot ini TIDAK berubah lagi walau bobot di `indikator_node` direvisi di kemudian hari — histori harus tetap bisa dibaca apa adanya pada saat itu.
- `target_tahunan` (baseline dan target 2025-2029 dari Renstra) adalah tabel TERPISAH dari target operasional per triwulan. Jangan dicampur.
- Sebagian leaf node tidak berlaku untuk UPT tertentu (contoh: PPSDMPU sebagai pembina tidak punya data "Tingkat Kelulusan" seperti UPT penyelenggara diklat). WAJIB ada mekanisme N/A per kombinasi UPT x node (`node_upt.berlaku = false`), BUKAN memaksa semua UPT mengisi semua field.

## 4. Sumber Data — Manual vs API, Per IKA Berbeda

| IKA | Sumber |
|---|---|
| IKA.01 | Sebagian besar via API UPT (data akademik: lulusan, IPK, sertifikasi, peserta) |
| IKA.04 | Sebagian via API UPT (jumlah dosen/instruktur, jumlah fasilitas); sisanya manual (skor kepuasan hasil survei) |
| IKA.02, 03, 05, 06 | Manual sepenuhnya — sumbernya predikat akreditasi, kebijakan Pusat, atau instansi eksternal (BKN, Kemenkeu, ANRI, KemenPAN-RB) |

Aturan API:
- Pola **pull**: sistem IKA yang memanggil API tiap UPT, bukan sebaliknya.
- Kontrak respons: `GET {base_url}/ika/v1/data?tahun&triwulan` mengembalikan daftar `{kode, nilai}` sesuai kode leaf node di `indikator_node`.
- Data dari API masuk dengan status `DRAFT` dan `sumber = 'API'` di `laporan_isi` — WAJIB diverifikasi Admin UPT sebelum disubmit. JANGAN langsung menandainya final.
- Konfigurasi per UPT (`upt_api_config`): base_url, jenis auth, referensi secret (bukan secret itu sendiri — secret di environment variable/secret manager), jadwal sync. Panggilan API hanya dari server (route handler/edge function), TIDAK PERNAH dari client.
- Data dari instansi eksternal (SAKIP, IKPA, Kearsipan, Maturitas BLU, IP ASN) TIDAK diintegrasikan otomatis pada versi ini — tetap input manual oleh Pusat. Jangan membangun integrasi ke instansi luar tanpa instruksi eksplisit.

## 5. Skema Database — WAJIB Mendukung Pohon Berjenjang

Skema HARUS berupa pohon self-referencing untuk `indikator_node`, bukan kolom tetap per level seperti pendekatan IKK. JELASKAN dulu rancangan final ke pengguna sebelum migration dijalankan.

```sql
create extension if not exists pgcrypto;

create table upt (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null,        -- "PPIC", "POLTEKBANG_SBY", dst
  nama text not null
);

create table indikator_node (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references indikator_node(id),   -- null untuk SKA
  kode text not null,                 -- "IKA.01", "A", "A.1"
  nama text not null,
  level text not null check (level in ('SKA','IKA','KOMPONEN','SUB','LEAF')),
  bobot numeric not null,             -- bobot terhadap parent, total per parent WAJIB = 1.0
  tipe_input text not null check (tipe_input in ('ANGKA','PREDIKAT','TURUNAN')),
  cap_100 boolean not null default false,   -- true hanya untuk node di bawah IKA.01 (lihat §2.3)
  min_nilai numeric,
  max_nilai numeric,                  -- null jika batas Max dinamis
  max_ref_node_id uuid references indikator_node(id),  -- leaf acuan untuk batas Max dinamis
  max_persen numeric,                 -- contoh 0.75 (lihat §2.4)
  urutan int,
  catatan text                        -- untuk menandai kasus khusus, mis. bug Excel §2.6
);

create table node_upt (
  node_id uuid references indikator_node(id),
  upt_id uuid references upt(id),
  berlaku boolean not null default true,
  primary key (node_id, upt_id)
);

create table predikat_konversi (
  id uuid primary key default gen_random_uuid(),
  jenis text not null,                -- "AKREDITASI"
  predikat text not null,
  skor numeric not null
);

create table periode (
  id uuid primary key default gen_random_uuid(),
  tahun int not null,
  triwulan int not null check (triwulan between 1 and 4),
  status text not null default 'BUKA' check (status in ('BUKA','TUTUP')),
  unique (tahun, triwulan)
);

create table laporan (
  id uuid primary key default gen_random_uuid(),
  upt_id uuid references upt(id) not null,
  periode_id uuid references periode(id) not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','APPROVED','REJECTED')),
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id),
  catatan text,
  unique (upt_id, periode_id)
);

create table laporan_isi (
  id uuid primary key default gen_random_uuid(),
  laporan_id uuid references laporan(id) on delete cascade,
  node_id uuid references indikator_node(id) not null,
  nilai_angka numeric,
  predikat_id uuid references predikat_konversi(id),
  sumber text not null default 'MANUAL' check (sumber in ('MANUAL','API')),
  keterangan text,
  unique (laporan_id, node_id)
);

create table hasil_hitung (
  id uuid primary key default gen_random_uuid(),
  laporan_id uuid references laporan(id) on delete cascade,
  node_id uuid references indikator_node(id) not null,
  realisasi numeric,
  skor_normalisasi numeric,
  skor_terbobot numeric,
  dihitung_pada timestamptz default now(),
  unique (laporan_id, node_id)
);

create table target_tahunan (
  id uuid primary key default gen_random_uuid(),
  node_id uuid references indikator_node(id) not null,
  tahun int not null,
  target numeric not null,            -- dari Renstra 2025-2029
  unique (node_id, tahun)
);

create table upt_api_config (
  id uuid primary key default gen_random_uuid(),
  upt_id uuid references upt(id) unique,
  base_url text,
  auth_type text check (auth_type in ('API_KEY','BEARER')),
  secret_ref text,                    -- referensi ke secret manager/env, BUKAN secret itu sendiri
  aktif boolean default false
);

create table sync_log (
  id uuid primary key default gen_random_uuid(),
  upt_id uuid references upt(id),
  periode_id uuid references periode(id),
  status text check (status in ('SUKSES','GAGAL','SEBAGIAN')),
  detail jsonb,
  dijalankan_pada timestamptz default now()
);

-- RLS: aktifkan di SEMUA tabel yang menyentuh data per-UPT
alter table laporan enable row level security;
alter table laporan_isi enable row level security;
alter table hasil_hitung enable row level security;

-- Admin UPT: hanya baca/tulis laporan milik upt_id sendiri (contoh pola, sesuaikan dengan skema auth/profile final)
create policy "admin_upt_scoped" on laporan
  for all to authenticated
  using (upt_id = (select upt_id from profiles where id = auth.uid()))
  with check (upt_id = (select upt_id from profiles where id = auth.uid()));

-- Super Admin Pusat & Pimpinan: akses lintas-UPT, dibedakan read-only vs full lewat role di tabel profiles
```

JANGAN membuat kolom terpisah per IKA/komponen dalam satu tabel besar — struktur pohon di atas yang WAJIB dipakai, karena jumlah dan susunan komponen berbeda-beda antar IKA dan bisa direvisi di kemudian hari tanpa migration (lihat §2.1).

## 6. RBAC — Tiga Role, Beda Scope

| Role | Scope | Akses |
|---|---|---|
| Admin UPT | Hanya `upt_id` miliknya sendiri | Input leaf node, submit laporan |
| Super Admin Pusat | Semua UPT | Approve/reject laporan, kelola `indikator_node` dan bobot |
| Pimpinan | Semua UPT | Read-only, dashboard agregat saja |

Role disimpan di tabel `profiles` (atau setara), terhubung ke `auth.users`. RLS WAJIB menegakkan scoping ini di level database, bukan hanya dicek di frontend — permintaan API langsung tanpa lewat UI tetap harus diblokir oleh RLS.

## 7. Testing Wajib untuk Logika Perhitungan

Karena kesalahan di `lib/ika/calculations.ts` membuat SEMUA angka di dashboard salah, fungsi di file ini WAJIB punya unit test (Vitest/Jest sesuai yang terpasang) mencakup minimal:
- Normalisasi dasar `(nilai-min)/(max-min)*100`, dengan nilai yang bisa diverifikasi manual
- Kasus cap 100: IKA.01 dibatasi, IKA lain tidak (§2.3)
- Batas Max dinamis: hasil berubah mengikuti leaf acuan (§2.4)
- Agregasi bottom-up: skor parent = jumlah skor terbobot anak, sampai ke level IKA
- Validasi total bobot anak = 1,0 (kasus valid dan kasus gagal)
- Konversi predikat lewat `predikat_konversi`
- Reproduksi angka IKA.01 dari Excel Capkin sebagai test acuan (nilai akhir harus sama persis)

## 8. Tooling & Perintah Wajib

- Package manager: **pnpm** — jangan gunakan npm/yarn install.
- Perintah umum: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm format`
- Sebelum menganggap task selesai, WAJIB jalankan `pnpm lint` dan `pnpm typecheck`, pastikan tidak ada error, dan laporkan hasilnya secara konkret.

## 9. Struktur Folder

```
app/
  (auth)/
    login/
      page.tsx
  (protected)/
    dashboard/
      page.tsx               # agregat semua UPT, untuk Pimpinan & Super Admin
    input/
      [periode]/
        page.tsx              # form input leaf node, untuk Admin UPT
    laporan/
      page.tsx                # daftar laporan + approve/reject, untuk Super Admin
    indicators/
      page.tsx                # lihat struktur pohon (edit pohon BUKAN scope v1, lihat §12)
    layout.tsx                 # cek session + role, redirect ke /login jika belum auth
  layout.tsx
  globals.css
components/
  ika/                         # TreeNodeForm, ScoreGauge, ApprovalCard, dll
lib/
  supabase/
    client.ts
    server.ts
  ika/
    calculations.ts            # SEMUA logika rumus (normalisasi, cap, agregasi) HARUS di sini
    tree.ts                    # helper membaca/menyusun struktur pohon indikator_node
  api-sync/
    pull.ts                    # logika pull API per UPT, dipanggil scheduled job
  types.ts
  utils.ts
supabase/
  migrations/
```

Logika perhitungan (normalisasi, cap, agregasi pohon) TIDAK BOLEH ditulis langsung di komponen React — WAJIB di `lib/ika/calculations.ts` supaya bisa dites terpisah dan dipakai ulang antara halaman Dashboard, Input, dan Laporan.

## 10. Konvensi Kode & Prinsip Kesederhanaan

- **Prinsip Anti-Overengineering (KISS & Pragmatis)**:
  - Kode WAJIB lugas, ringkas, dan *to-the-point*. DILARANG membuat abstraksi berlebihan (over-abstraction), lapisan wrapper yang tidak perlu, atau arsitektur yang bertele-tele.
  - Hindari pola kode yang rumit dan berbelit-belit yang menyulitkan proses maintenance, memperlambat debugging, atau membebani pembacaan data (read latency).
  - Utamakan keterbacaan (readability) dan kemudahan perawatan: alur data dari Supabase hingga ke tampilan UI harus jelas, bersih, dan langsung.
- Komponen React: PascalCase. Utilitas/hook: camelCase.
- Server Components sebagai default, `"use client"` hanya jika perlu interaktivitas.
- Semua akses database lewat `lib/supabase/` sesuai konteks (server/client).
- Semua tipe data di `lib/types.ts`, DILARANG pakai `any`.
- Validasi form pakai Zod + react-hook-form.
- Setiap fungsi di `lib/ika/calculations.ts` WAJIB punya komentar menjelaskan rumus dalam bahasa manusia, termasuk rujukan ke kode IKA/komponen asal (mis. "IKA.01 komponen C, lihat §2.4").


## 11. Database & Keamanan

- Semua tabel yang menyimpan data per-UPT (`laporan`, `laporan_isi`, `hasil_hitung`) WAJIB Row Level Security (RLS) aktif, scoped ke `upt_id`.
- `SUPABASE_SERVICE_ROLE_KEY` TIDAK BOLEH pernah diekspos ke client-side. Panggilan API ke UPT (pull) WAJIB pakai service role, dijalankan di server/edge function, tidak pernah dari browser.
- Setiap perubahan skema = migration file baru di `supabase/migrations/`, JANGAN edit langsung lewat dashboard tanpa dicatat sebagai migration.
- Constraint `unique (upt_id, periode_id)` di `laporan` dan `unique (laporan_id, node_id)` di `laporan_isi`/`hasil_hitung` tidak boleh dihapus.
- Kredensial API tiap UPT (`upt_api_config.secret_ref`) disimpan sebagai referensi ke secret manager/environment variable, BUKAN sebagai nilai mentah di tabel.

## 12. Checklist Konfigurasi Manual (BUKAN tugas AI agent)

- [ ] Buat project Supabase baru
- [ ] Catat Project URL, anon public key, service_role key
- [ ] Jalankan migration lewat SQL Editor atau Supabase CLI
- [ ] Seed `indikator_node` dari struktur Excel Capkin (IKA.01 dulu sebagai acuan uji)
- [ ] Buat akun untuk 8 Admin UPT, 1 Super Admin Pusat, akun Pimpinan, lewat Authentication → Users
- [ ] Matikan "Allow new users to sign up"
- [ ] Isi Site URL di Authentication → URL Configuration
- [ ] Isi `.env.local` (jangan commit)
- [ ] (Opsional, per UPT yang sudah siap) isi `upt_api_config` setelah endpoint UPT tersedia

## 13. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
```

## 14. Git & Commit

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Satu commit = satu perubahan logis.
- Jangan commit `.env.local`, `node_modules/`, `.next/`.

## 15. Error Handling & UX

- Form input WAJIB pesan error jelas, bukan hanya console.log.
- Loading state (skeleton) saat fetch data, jangan biarkan halaman kosong.
- Toast/notifikasi error saat gagal fetch/insert/sync API.
- Status sinkronisasi API ditampilkan eksplisit ke Admin UPT (sukses/gagal/sebagian), termasuk leaf node mana yang gagal ditarik — jangan tampilkan "berhasil" kalau sebagian data gagal masuk.
- Node bertipe N/A untuk suatu UPT ditampilkan sebagai "Tidak berlaku", bukan kosong tanpa keterangan.

## 16. Yang TIDAK Boleh Dilakukan Agent

- Jangan menambah role/user baru tanpa diminta eksplisit.
- Jangan menambah dependency besar (termasuk task queue seperti BullMQ/Redis) tanpa alasan kuat dan tanpa bertanya dulu — sinkronisasi API UPT cukup pakai scheduled job sederhana (Vercel Cron), bukan queue, karena frekuensinya per triwulan.
- Jangan mengubah struktur tabel tanpa migration file.
- Jangan membuat kolom/constraint `month` untuk entitas laporan IKA — WAJIB `tahun` + `triwulan` (1-4). Ini kebalikan dari project IKK, jangan tertukar.
- Jangan menyamakan cap-100 untuk semua IKA — hanya IKA.01 (§2.3).
- Jangan memperlakukan leaf bertipe TURUNAN sebagai input manual, atau sebaliknya.
- Jangan mereplikasi atau "memperbaiki" bug formula Excel (§2.6) tanpa menandainya eksplisit ke pengguna lebih dulu.
- Jangan menandai data dari API sebagai final/SUBMITTED secara otomatis — harus lewat status DRAFT dan verifikasi Admin UPT.
- Jangan membangun integrasi otomatis ke instansi eksternal (BKN, Kemenkeu, ANRI, KemenPAN-RB) tanpa instruksi eksplisit.
- Jangan membangun editor pohon/bobot lewat UI di v1 — struktur dan bobot dimuat lewat seed data (lihat §17). Fitur ini ditunda sampai calculation engine terbukti cocok dengan Excel.
- Jangan ganti library/framework styling yang sudah berjalan tanpa alasan teknis dan konfirmasi eksplisit.
- Jangan mengabaikan atau menghapus isi file AGENTS.md ini.

## 17. Sebelum Menyelesaikan Task

- Jalankan `pnpm lint` dan `pnpm typecheck`, laporkan hasil konkret.
- Kerjakan SATU langkah kecil dulu, laporkan hasilnya, TUNGGU instruksi lanjutan.
- Untuk perubahan skema database: jelaskan dulu rancangan, tunggu konfirmasi, baru migration.
- Urutan pengembangan v1 yang disepakati: (1) seed `indikator_node` untuk IKA.01 dari Excel, (2) `lib/ika/calculations.ts` + test sampai angka IKA.01 cocok persis dengan Excel, (3) baru lanjut IKA.03/04/05/06, lalu IKA.02 terakhir (strukturnya paling butuh konfirmasi stakeholder, lihat §2.6). Jangan loncat ke fitur lain (form, dashboard, API sync) sebelum engine IKA.01 terverifikasi.

## 18. Deployment

- Target: Vercel, auto-deploy dari branch `main`.
- Pastikan environment variables sudah diisi di dashboard Vercel sebelum deploy pertama.
- Scheduled sync API UPT (§4) pakai Vercel Cron, dijadwalkan menjelang akhir tiap triwulan, bukan harian/real-time.

### 18.1 Migrasi Akun Supabase (Development -> Live Production Institusi)

**Catatan Permanen:** Akun Supabase saat tahap pengembangan menggunakan akun developer. Saat siap deploy secara live/resmi untuk kedinasan:
1. Buat project baru di Supabase menggunakan **akun resmi staf / email kedinasan PPSDMPU**.
2. Buka SQL Editor di project baru, jalankan seluruh file migration berurutan dari folder `supabase/migrations/`.
3. Jalankan ulang seed `indikator_node`, `predikat_konversi`, dan `target_tahunan` di project baru.
4. Buat akun 8 Admin UPT, 1 Super Admin Pusat, dan akun Pimpinan lewat menu **Authentication → Users**.
5. Matikan opsi **"Allow new users to sign up"** di menu Authentication Settings.
6. Salin Project URL, `anon` public key, dan `service_role` key ke menu **Environment Variables** di dashboard Vercel.
7. Isi `upt_api_config` untuk UPT yang sudah siap API-nya, dengan secret di environment variable project baru.
8. Kode aplikasi Next.js harus *fully decoupled* (tanpa hardcode), sehingga peralihan ke akun instansi dapat langsung berjalan tanpa mengubah kode sumber.

## 19. Design System & Tampilan Visual (Executive Aesthetic)

**Ruang lingkup bagian ini MURNI visual/UI.** Diadopsi dari panduan desain sistem IKK supaya tampilan IKA konsisten dengan IKK. TIDAK ADA satu pun ketentuan di bagian ini yang mengubah atau menggantikan skema database, RLS, struktur pohon indikator, atau logika kalkulasi di §2-§6 — kalau ada bagian lain dari dokumen sumbernya (skema `ika_entries` flat, wizard 1-nilai-per-triwulan, RLS `using (true)`, 3 tipe rumus generik) terlihat bertentangan dengan §2-§6, yang berlaku adalah §2-§6. Jangan menyalin skema/logika dari dokumen sumber desain ini.

### 19.1 Tipografi
- Font utama: **Plus Jakarta Sans** (Google Fonts via `next/font/google`).
- Bobot: `300`/`400` untuk teks deskripsi, `500`/`600` untuk label form, `700`/`800` untuk judul dan angka skor.

### 19.2 Palet Warna & Semantic Design Tokens
- **Primary/Brand Chrome**: Indigo (`#4F46E5`, hover `#4338CA`) untuk tombol utama, tab aktif, border seleksi. Jangan pakai hijau/merah untuk elemen brand, supaya tidak tertukar dengan warna status capaian.
- **Status capaian** (dipakai di dashboard dan rekapitulasi, lihat §19.4): Tercapai ≥100% = Emerald (`#10B981`), Mendekati 80-99,9% = Amber (`#F59E0B`), Kritis <80% = Rose (`#EF4444`). Ambang batas ini murni untuk pewarnaan tampilan, TIDAK mengubah cap-100 atau aturan normalisasi di §2.3.

### 19.3 Dark Mode — Executive Midnight Slate
- Background utama `#0B0F19` (`dark:bg-slate-950`), permukaan card `#0F172A`/`#1E293B`, border `dark:border-slate-800`/`dark:border-slate-700`, teks `dark:text-slate-100` (judul) dan `dark:text-slate-400` (subteks).
- Script Zero-FOUC WAJIB inline di `<head>` (`app/layout.tsx`), cek `localStorage.getItem('ika_theme')` sebelum DOM dirender.

### 19.4 Layout Shell & Navigasi
- `components/ika/AppShell.tsx`: desktop sidebar permanen `w-64`/`w-72`; mobile hamburger + sliding drawer backdrop blur.
- `components/ika/Sidebar.tsx`: logo Kemenhub & PPSDMPU, menu (ikon Lucide): Dashboard (`LayoutDashboard`), Input Data (`FileSpreadsheet`), Laporan/Approval (`Table`), Indikator (`Settings2`/`Layers`). Footer: ThemeToggle, info profil (termasuk role dan UPT untuk Admin UPT), tombol Logout.
- Tabel rekap dan kartu skor memakai tiga warna status di §19.2, dihitung dari `skor_terbobot` hasil engine §2-§5 — bukan dari ambang generik tipe rasio seperti di dokumen sumber.

### 19.5 Komponen Dashboard & Visualisasi
- Metric card ringkasan (rata-rata capaian, jumlah IKA per status), bar chart horizontal perbandingan 6 IKA, donut chart distribusi status — pakai Recharts, isi datanya dari `hasil_hitung` per §5, bukan dari tabel flat `ika_entries`.
- Tombol ekspor Excel (ExcelJS) dan cetak PDF (`@media print`) boleh direplikasi apa adanya sebagai fitur, terlepas dari sumber datanya yang berbeda struktur.
