// lib/ika/calculations.ts
// Engine perhitungan Sistem Informasi IKA PPSDMPU
// Mengacu pada formula Excel Capkin dan aturan AGENTS.md (§2.1 - §2.6)

export interface HasilSkorNode {
  realisasi: number;
  skorNormalisasi: number;
  skorTerbobot: number;
}

/**
 * 1. Normalisasi Nilai Dasar
 * Rumus dasar Excel: Skor = (Nilai - Min) / (Max - Min) * 100
 * @param nilai Nilai realisasi aktual
 * @param min Nilai batas minimum target
 * @param max Nilai batas maksimum target
 * @param cap100 Apakah skor dibatasi maksimal 100 (HANYA TRUE untuk IKA.01, lihat AGENTS.md §2.3)
 */
export function hitungNormalisasi(
  nilai: number,
  min: number,
  max: number,
  cap100: boolean = false
): number {
  if (max <= min) return 0;
  
  // Hitung normalisasi
  let skor = ((nilai - min) / (max - min)) * 100;
  
  // Nilai di bawah min dinilai 0
  if (skor < 0) skor = 0;

  // IKA.01 dibatasi maksimal 100, IKA lain boleh > 100 jika melampaui target
  if (cap100 && skor > 100) {
    skor = 100;
  }

  // Bulatkan 2 angka desimal untuk kepresisian
  return Math.round(skor * 100) / 100;
}

/**
 * 2. Perhitungan Batas Max Dinamis (IKA.01 Komponen C, lihat §2.4)
 * Di Excel: ROUND(refNilai * persentase, 0)
 * Contoh: Max(C.1) = ROUND(Jumlah Lulusan s.d. tahun t * 75%, 0)
 */
export function hitungBatasMaxDinamis(refNilai: number, persen: number): number {
  if (!refNilai || refNilai <= 0) return 0;
  return Math.round(refNilai * persen);
}

/**
 * 3. Validasi Total Bobot Anak = 1.0 (lihat AGENTS.md §2.5)
 * Memastikan total bobot seluruh anak dari satu parent tepat 1.0 (toleransi floating point 0.0001)
 */
export function validasiTotalBobot(bobotList: number[]): { valid: boolean; total: number } {
  const total = bobotList.reduce((acc, b) => acc + b, 0);
  const roundedTotal = Math.round(total * 10000) / 10000;
  return {
    valid: Math.abs(roundedTotal - 1.0) < 0.0001,
    total: roundedTotal,
  };
}

/**
 * 4. Konversi Predikat Resmi ke Nilai Angka (lihat AGENTS.md §2.2)
 * Standar: Unggul=4, A=3.5, Baik Sekali=3, B=2.5, Baik=2, C=1
 */
export const DAFTAR_PREDIKAT_DEFAULT: Record<string, number> = {
  UNGGUL: 4,
  A: 3.5,
  'BAIK SEKALI': 3,
  B: 2.5,
  BAIK: 2,
  C: 1,
};

export function konversiPredikat(
  predikat: string,
  mapKonversi: Record<string, number> = DAFTAR_PREDIKAT_DEFAULT
): number {
  const key = predikat.trim().toUpperCase();
  return mapKonversi[key] ?? 0;
}

// ============================================================================
// KALKULASI SPESIFIK IKA.01 (Indeks Kompetensi SDM Transportasi Udara)
// ============================================================================

export interface InputIka01KomponenA {
  jumlahLulusan: number;
  jumlahLulusanTepatWaktu: number;
  ipk35KeAtas: number;
  ipk30sd35: number;
  ipk275sd30?: number;
  ipkKurang275?: number;
}

/**
 * Kalkulasi IKA.01 Komponen A: Tingkat Kelulusan
 * A.1: Persentase Tepat Waktu = (Tepat Waktu / Total) * 100 [Bobot 0.6, Min 0, Max 100]
 * A.2: Persentase IPK >= 3.0 = ((IPK >=3.5 + IPK 3.0-3.5) / Total) * 100 [Bobot 0.4, Min 80, Max 100]
 */
export function hitungIka01KomponenA(input: InputIka01KomponenA) {
  const { jumlahLulusan, jumlahLulusanTepatWaktu, ipk35KeAtas, ipk30sd35 } = input;
  
  if (!jumlahLulusan || jumlahLulusan <= 0) {
    return { realisasiA1: 0, skorA1: 0, realisasiA2: 0, skorA2: 0, skorKomponenA: 0 };
  }

  // A.1
  const realisasiA1 = (jumlahLulusanTepatWaktu / jumlahLulusan) * 100;
  const skorA1 = hitungNormalisasi(realisasiA1, 0, 100, true);

  // A.2 (IPK >= 3.0, target min 80%, max 100%)
  const totalIpkDiatas3 = ipk35KeAtas + ipk30sd35;
  const realisasiA2 = (totalIpkDiatas3 / jumlahLulusan) * 100;
  const skorA2 = hitungNormalisasi(realisasiA2, 80, 100, true);

  // Komponen A = A.1 * 0.6 + A.2 * 0.4
  const skorKomponenA = Math.round((skorA1 * 0.6 + skorA2 * 0.4) * 100) / 100;

  return {
    realisasiA1: Math.round(realisasiA1 * 100) / 100,
    skorA1,
    realisasiA2: Math.round(realisasiA2 * 100) / 100,
    skorA2,
    skorKomponenA,
  };
}

export interface InputIka01KomponenC {
  totalLulusanSdThnT: number; // C.6 (Leaf Acuan)
  bekerjaKurang6Bln: number;  // C.1 (75%)
  bekerja6sd12Bln: number;    // C.2 (20%)
  bekerja12sd18Bln: number;   // C.3 (3%)
  bekerja18sd24Bln: number;   // C.4 (2%)
}

/**
 * Kalkulasi IKA.01 Komponen C: Tingkat Penyerapan Lulusan
 * Max batas dinamis dihitung dari C.6 (Total Lulusan s.d. Tahun t)
 * Catatan Khusus Excel: Jika C.1 >= 100, maka skor C langsung dikunci = 100
 */
export function hitungIka01KomponenC(input: InputIka01KomponenC) {
  const { totalLulusanSdThnT, bekerjaKurang6Bln, bekerja6sd12Bln, bekerja12sd18Bln, bekerja18sd24Bln } = input;

  if (!totalLulusanSdThnT || totalLulusanSdThnT <= 0) {
    return { skorC1: 0, skorC2: 0, skorC3: 0, skorC4: 0, skorKomponenC: 0 };
  }

  // Batas max dinamis per sub-kategori
  const maxC1 = hitungBatasMaxDinamis(totalLulusanSdThnT, 0.75);
  const maxC2 = hitungBatasMaxDinamis(totalLulusanSdThnT, 0.20);
  const maxC3 = hitungBatasMaxDinamis(totalLulusanSdThnT, 0.03);
  const maxC4 = hitungBatasMaxDinamis(totalLulusanSdThnT, 0.02);

  const skorC1 = hitungNormalisasi(bekerjaKurang6Bln, 0, maxC1, true);
  const skorC2 = hitungNormalisasi(bekerja6sd12Bln, 0, maxC2, true);
  const skorC3 = hitungNormalisasi(bekerja12sd18Bln, 0, maxC3, true);
  const skorC4 = hitungNormalisasi(bekerja18sd24Bln, 0, maxC4, true);

  // Bobot: C.1=0.8, C.2=0.16, C.3=0.024, C.4=0.016 (Total = 1.0)
  let skorKomponenC = skorC1 * 0.8 + skorC2 * 0.16 + skorC3 * 0.024 + skorC4 * 0.016;

  // Aturan Khusus Excel: Jika C.1 >= 100, maka C langsung dikunci = 100
  if (skorC1 >= 100) {
    skorKomponenC = 100;
  } else {
    skorKomponenC = Math.min(100, Math.round(skorKomponenC * 100) / 100);
  }

  return {
    maxC1,
    maxC2,
    maxC3,
    maxC4,
    skorC1,
    skorC2,
    skorC3,
    skorC4,
    skorKomponenC: Math.round(skorKomponenC * 100) / 100,
  };
}

export interface InputIka01KomponenD {
  kompetensi: number; // Skala 0 - 4
  kinerja: number;    // Skala 0 - 4
  etosKerja: number;  // Skala 0 - 4
}

/**
 * Kalkulasi IKA.01 Komponen D: Tingkat Kepuasan Pengguna Lulusan
 * D.1: Kompetensi (Bobot 0.4, Skala 0-4 dinormalisasi ke 0-100)
 * D.2: Kinerja (Bobot 0.3, Skala 0-4 dinormalisasi ke 0-100)
 * D.3: Etos Kerja (Bobot 0.3, Skala 0-4 dinormalisasi ke 0-100)
 */
export function hitungIka01KomponenD(input: InputIka01KomponenD) {
  const skorD1 = hitungNormalisasi(input.kompetensi, 0, 4, true);
  const skorD2 = hitungNormalisasi(input.kinerja, 0, 4, true);
  const skorD3 = hitungNormalisasi(input.etosKerja, 0, 4, true);

  const skorKomponenD = Math.round((skorD1 * 0.4 + skorD2 * 0.3 + skorD3 * 0.3) * 100) / 100;

  return {
    skorD1,
    skorD2,
    skorD3,
    skorKomponenD: Math.min(100, skorKomponenD),
  };
}

/**
 * Agregasi Total Nilai Akhir IKA.01
 * Bobot: A (0.2) + B (0.2) + C (0.3) + D (0.3) = 1.0
 * Cap 100 aktif untuk IKA.01 (lihat AGENTS.md §2.3)
 */
export function hitungTotalIka01(
  skorA: number,
  skorB: number,
  skorC: number,
  skorD: number
): number {
  const total = skorA * 0.2 + skorB * 0.2 + skorC * 0.3 + skorD * 0.3;
  return Math.min(100, Math.round(total * 100) / 100);
}

// ============================================================================
// KALKULASI IKA.03 (Indeks Kebijakan Pengembangan SDM Transportasi Udara)
// Catatan: cap_100 = false (tidak dibatasi 100, lihat §2.3)
// ============================================================================

/**
 * Komponen C IKA.03: Turunan dari 4 skor komponen IKA.01 (A, B, C, D)
 * Rata-rata terbobot masing-masing 0.25 (lihat AGENTS.md §2.2)
 */
export function hitungIka03KomponenC(
  skorIka01A: number,
  skorIka01B: number,
  skorIka01C: number,
  skorIka01D: number
): number {
  const rataRata = (skorIka01A + skorIka01B + skorIka01C + skorIka01D) / 4;
  return Math.round(rataRata * 100) / 100;
}

/**
 * Total Akhir IKA.03
 * Bobot: A (0.3) + B (0.3) + C (0.3) + D (0.1) = 1.0
 * Tanpa cap 100
 */
export function hitungTotalIka03(
  skorA: number,
  skorB: number,
  skorC: number,
  skorD: number
): number {
  const total = skorA * 0.3 + skorB * 0.3 + skorC * 0.3 + skorD * 0.1;
  return Math.round(total * 100) / 100;
}

// ============================================================================
// KALKULASI IKA.04 (Indeks Kualitas Layanan Diklat SDM)
// Catatan: cap_100 = false (tidak dibatasi 100, lihat §2.3)
// ============================================================================

export interface InputIka04KomponenB {
  totalDosenInstruktur: number; // B.3 (Leaf Acuan)
  dosenBerkualifikasi: number;  // B.1 (95%)
  dosenTersertifikasi: number;  // B.2 (85%)
}

/**
 * Komponen B IKA.04: Tingkat Sertifikasi Tenaga Pendidik
 * Batas max dinamis dihitung dari B.3 (Jumlah Dosen/Instruktur)
 * Max(B.1) = 95% * B.3, Max(B.2) = 85% * B.3
 */
export function hitungIka04KomponenB(input: InputIka04KomponenB) {
  const { totalDosenInstruktur, dosenBerkualifikasi, dosenTersertifikasi } = input;
  if (!totalDosenInstruktur || totalDosenInstruktur <= 0) {
    return { skorB1: 0, skorB2: 0, skorKomponenB: 0 };
  }

  const maxB1 = hitungBatasMaxDinamis(totalDosenInstruktur, 0.95);
  const maxB2 = hitungBatasMaxDinamis(totalDosenInstruktur, 0.85);

  const skorB1 = hitungNormalisasi(dosenBerkualifikasi, 0, maxB1, false);
  const skorB2 = hitungNormalisasi(dosenTersertifikasi, 0, maxB2, false);

  const skorKomponenB = Math.round((skorB1 * 0.5 + skorB2 * 0.5) * 100) / 100;

  return { maxB1, maxB2, skorB1, skorB2, skorKomponenB };
}

/**
 * Total Akhir IKA.04
 * 4 Komponen x Bobot 0.25 (Total = 1.0)
 */
export function hitungTotalIka04(
  skorA: number,
  skorB: number,
  skorC: number,
  skorD: number
): number {
  const total = (skorA + skorB + skorC + skorD) * 0.25;
  return Math.round(total * 100) / 100;
}

// ============================================================================
// KALKULASI IKA.05 (Indeks Profesionalisme ASN)
// ============================================================================

export function hitungTotalIka05(nilaiAsnUpt: number): number {
  return hitungNormalisasi(nilaiAsnUpt, 0, 100, false);
}

// ============================================================================
// KALKULASI IKA.06 (Indeks Akuntabilitas)
// 4 Komponen x Bobot 0.25 (Total = 1.0)
// ============================================================================

export function hitungTotalIka06(
  skorSakip: number,
  skorIkpa: number,
  skorKearsipan: number,
  skorMaturitasBlu: number
): number {
  const skorBluNormal = skorMaturitasBlu <= 5 ? (skorMaturitasBlu / 5) * 100 : skorMaturitasBlu;
  const total = (skorSakip + skorIkpa + skorKearsipan + skorBluNormal) * 0.25;
  return Math.round(total * 100) / 100;
}


// ============================================================================
// KALKULASI IKA.02 (Indeks Akreditasi dan Sertifikasi Lembaga Diklat)
// Menerapkan OPSI B: Replika Eksak Formula Excel Sumber (lihat AGENTS.md §2.6)
// ============================================================================

/**
 * Komponen A IKA.02: Akreditasi Institusi
 * Formula Excel sumber: IF(rata-rata < 3, rata-rata + 1) tanpa ELSE -> menghasilkan 0 jika >= 3
 */
export function hitungIka02KomponenA(nilai7Upt: number[]): { rataRata: number; skorKomponenA: number } {
  if (nilai7Upt.length === 0) return { rataRata: 0, skorKomponenA: 0 };
  const rataRata = nilai7Upt.reduce((a, b) => a + b, 0) / nilai7Upt.length;
  // Opsi B: jika rataRata < 3 dapat bonus +1, jika >= 3 menghasilkan 0 (replika bug Excel asli)
  const skorKomponenA = rataRata < 3 ? rataRata + 1 : 0;
  return {
    rataRata: Math.round(rataRata * 100) / 100,
    skorKomponenA: Math.round(skorKomponenA * 100) / 100,
  };
}

/**
 * Komponen B IKA.02: Akreditasi Program Studi per UPT
 * Formula Excel sumber: IF(rata-rata < 3.5, rata-rata + 0.5) tanpa ELSE -> menghasilkan 0 jika >= 3.5
 */
export function hitungIka02KomponenBPerUpt(nilaiProdi: number[]): { rataRata: number; skorUpt: number } {
  if (nilaiProdi.length === 0) return { rataRata: 0, skorUpt: 0 };
  const rataRata = nilaiProdi.reduce((a, b) => a + b, 0) / nilaiProdi.length;
  // Opsi B: jika rataRata < 3.5 dapat bonus +0.5, jika >= 3.5 menghasilkan 0 (replika bug Excel asli)
  const skorUpt = rataRata < 3.5 ? rataRata + 0.5 : 0;
  return {
    rataRata: Math.round(rataRata * 100) / 100,
    skorUpt: Math.round(skorUpt * 100) / 100,
  };
}

/**
 * Total Akhir IKA.02
 * Bobot: A (0.3) + B (0.3) + C (0.2) + D (0.2) = 1.0
 * Tanpa cap 100 (lihat AGENTS.md §2.3)
 */
export function hitungTotalIka02(
  skorA: number,
  skorB: number,
  skorC: number,
  skorD: number
): number {
  const total = skorA * 0.3 + skorB * 0.3 + skorC * 0.2 + skorD * 0.2;
  return Math.round(total * 100) / 100;
}


