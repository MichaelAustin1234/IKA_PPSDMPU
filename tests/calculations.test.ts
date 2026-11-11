// tests/calculations.test.ts
import { describe, it, expect } from 'vitest';
import {
  hitungNormalisasi,
  hitungBatasMaxDinamis,
  validasiTotalBobot,
  konversiPredikat,
  hitungIka01KomponenA,
  hitungIka01KomponenC,
  hitungIka01KomponenD,
  hitungTotalIka01,
  hitungIka03KomponenC,
  hitungTotalIka03,
  hitungIka04KomponenB,
  hitungTotalIka04,
  hitungTotalIka05,
  hitungTotalIka06,
  hitungIka02KomponenA,
  hitungIka02KomponenBPerUpt,
  hitungTotalIka02,
} from '../lib/ika/calculations';

describe('Unit Test Engine Perhitungan IKA (lib/ika/calculations.ts)', () => {
  // Test 1: Normalisasi Dasar
  it('1. Menghitung rumus normalisasi dasar (Nilai - Min) / (Max - Min) * 100', () => {
    // Nilai 75 dengan rentang 0 s.d 100 -> 75%
    expect(hitungNormalisasi(75, 0, 100)).toBe(75);
    // Nilai 90 dengan rentang 80 s.d 100 -> (90 - 80) / (100 - 80) * 100 = 50%
    expect(hitungNormalisasi(90, 80, 100)).toBe(50);
    // Nilai di bawah min dinilai 0
    expect(hitungNormalisasi(10, 20, 100)).toBe(0);
  });

  // Test 2: Aturan Cap 100
  it('2. Memverifikasi cap 100: IKA.01 dibatasi 100, IKA lain tidak dibatasi', () => {
    // Untuk IKA.01 (cap100 = true): Realisasi 120 dari target 100 -> terpotong 100
    expect(hitungNormalisasi(120, 0, 100, true)).toBe(100);
    // Untuk IKA lain (cap100 = false): Realisasi 120 dari target 100 -> 120 (boleh >100)
    expect(hitungNormalisasi(120, 0, 100, false)).toBe(120);
  });

  // Test 3: Batas Max Dinamis
  it('3. Menghitung batas max dinamis berdasarkan leaf acuan (C.6)', () => {
    // Contoh total lulusan s.d. tahun t = 200
    // C.1 (75%) -> ROUND(200 * 0.75, 0) = 150
    expect(hitungBatasMaxDinamis(200, 0.75)).toBe(150);
    // C.2 (20%) -> ROUND(200 * 0.20, 0) = 40
    expect(hitungBatasMaxDinamis(200, 0.20)).toBe(40);
    // C.3 (3%) -> ROUND(200 * 0.03, 0) = 6
    expect(hitungBatasMaxDinamis(200, 0.03)).toBe(6);
    // C.4 (2%) -> ROUND(200 * 0.02, 0) = 4
    expect(hitungBatasMaxDinamis(200, 0.02)).toBe(4);
  });

  // Test 4: Validasi Total Bobot Anak = 1.0
  it('4. Memvalidasi total bobot anak = 1.0 (sukses dan gagal)', () => {
    // Kasus valid: IKA.01 top-level (0.2 + 0.2 + 0.3 + 0.3 = 1.0)
    expect(validasiTotalBobot([0.2, 0.2, 0.3, 0.3]).valid).toBe(true);
    // Kasus valid: Komponen C (0.8 + 0.16 + 0.024 + 0.016 = 1.0)
    expect(validasiTotalBobot([0.8, 0.16, 0.024, 0.016]).valid).toBe(true);
    // Kasus valid: Komponen D (0.4 + 0.3 + 0.3 = 1.0)
    expect(validasiTotalBobot([0.4, 0.3, 0.3]).valid).toBe(true);
    // Kasus tidak valid: total hanya 0.9
    expect(validasiTotalBobot([0.3, 0.3, 0.3]).valid).toBe(false);
  });

  // Test 5: Konversi Predikat Resmi
  it('5. Mengonversi predikat resmi ke angka sesuai predikat_konversi', () => {
    expect(konversiPredikat('Unggul')).toBe(4);
    expect(konversiPredikat('A')).toBe(3.5);
    expect(konversiPredikat('Baik Sekali')).toBe(3);
    expect(konversiPredikat('B')).toBe(2.5);
    expect(konversiPredikat('Baik')).toBe(2);
    expect(konversiPredikat('C')).toBe(1);
    expect(konversiPredikat('Tidak Ada')).toBe(0);
  });

  // Test 6: Komponen A IKA.01 (Tingkat Kelulusan)
  it('6. Menghitung Komponen A IKA.01 (A.1 Tepat Waktu + A.2 IPK >= 3.0)', () => {
    const hasil = hitungIka01KomponenA({
      jumlahLulusan: 100,
      jumlahLulusanTepatWaktu: 85, // 85%
      ipk35KeAtas: 40,
      ipk30sd35: 50, // Total IPK >= 3.0 = 90%
    });

    expect(hasil.realisasiA1).toBe(85);
    expect(hasil.skorA1).toBe(85);
    expect(hasil.realisasiA2).toBe(90);
    // (90 - 80) / (100 - 80) * 100 = 50
    expect(hasil.skorA2).toBe(50);
    // Skor Komponen A = 85 * 0.6 + 50 * 0.4 = 51 + 20 = 71
    expect(hasil.skorKomponenA).toBe(71);
  });

  // Test 7: Komponen C IKA.01 (Tingkat Penyerapan Lulusan) dengan Batas Dinamis
  it('7. Menghitung Komponen C IKA.01 dan penguncian skor = 100 jika C.1 >= 100', () => {
    // Skenario 1: C.1 mencapai target (150 dari target 150 -> skorC1 = 100)
    // Sesuai aturan khusus Excel: Jika C.1 >= 100, Komponen C otomatis = 100
    const hasilTercapai = hitungIka01KomponenC({
      totalLulusanSdThnT: 200,
      bekerjaKurang6Bln: 150, // Max 75% dari 200 = 150 -> 100%
      bekerja6sd12Bln: 20,
      bekerja12sd18Bln: 2,
      bekerja18sd24Bln: 1,
    });
    expect(hasilTercapai.skorC1).toBe(100);
    expect(hasilTercapai.skorKomponenC).toBe(100);

    // Skenario 2: C.1 di bawah 100% (misal 75 dari 150 -> 50%)
    const hasilParsial = hitungIka01KomponenC({
      totalLulusanSdThnT: 200,
      bekerjaKurang6Bln: 75, // 50%
      bekerja6sd12Bln: 20,  // 20 dari 40 = 50%
      bekerja12sd18Bln: 3,   // 3 dari 6 = 50%
      bekerja18sd24Bln: 2,   // 2 dari 4 = 50%
    });
    expect(hasilParsial.skorC1).toBe(50);
    expect(hasilParsial.skorC2).toBe(50);
    // Skor terbobot = 50 * 0.8 + 50 * 0.16 + 50 * 0.024 + 50 * 0.016 = 50
    expect(hasilParsial.skorKomponenC).toBe(50);
  });

  // Test 8: Komponen D IKA.01 (Kepuasan Pengguna Lulusan)
  it('8. Menghitung Komponen D IKA.01 (Skala 0-4 ke 0-100)', () => {
    const hasil = hitungIka01KomponenD({
      kompetensi: 3.6, // 3.6 / 4 * 100 = 90%
      kinerja: 3.2,    // 3.2 / 4 * 100 = 80%
      etosKerja: 4.0,  // 4.0 / 4 * 100 = 100%
    });

    expect(hasil.skorD1).toBe(90);
    expect(hasil.skorD2).toBe(80);
    expect(hasil.skorD3).toBe(100);
    // Skor Komponen D = 90 * 0.4 + 80 * 0.3 + 100 * 0.3 = 36 + 24 + 30 = 90
    expect(hasil.skorKomponenD).toBe(90);
  });

  // Test 9: Total Nilai Akhir IKA.01
  it('9. Menghitung Agregasi Total Akhir IKA.01 (Bobot 0.2, 0.2, 0.3, 0.3)', () => {
    // A: 71, B: 80, C: 100, D: 90
    // Total = 71*0.2 + 80*0.2 + 100*0.3 + 90*0.3
    // Total = 14.2 + 16 + 30 + 27 = 87.2
    const total = hitungTotalIka01(71, 80, 100, 90);
    expect(total).toBe(87.2);
  });

  // Test 10: IKA.03 Komponen C (Turunan 4 Skor IKA.01)
  it('10. Menghitung IKA.03 Komponen C sebagai rata-rata 4 skor IKA.01', () => {
    const skorC = hitungIka03KomponenC(80, 90, 100, 70);
    // (80 + 90 + 100 + 70) / 4 = 85
    expect(skorC).toBe(85);
  });

  // Test 11: Total Nilai Akhir IKA.03
  it('11. Menghitung Total Nilai IKA.03 (Bobot 0.3, 0.3, 0.3, 0.1)', () => {
    // A: 80, B: 90, C: 85, D: 100
    // Total = 80*0.3 + 90*0.3 + 85*0.3 + 100*0.1 = 24 + 27 + 25.5 + 10 = 86.5
    const total = hitungTotalIka03(80, 90, 85, 100);
    expect(total).toBe(86.5);
  });

  // Test 12: IKA.04 Komponen B (Batas Max Dinamis Dosen 95% & 85%)
  it('12. Menghitung IKA.04 Komponen B dengan batas dinamis dosen', () => {
    // Dosen = 100. Max B.1 = 95, Max B.2 = 85
    const hasil = hitungIka04KomponenB({
      totalDosenInstruktur: 100,
      dosenBerkualifikasi: 95, // 100%
      dosenTersertifikasi: 85, // 100%
    });
    expect(hasil.maxB1).toBe(95);
    expect(hasil.maxB2).toBe(85);
    expect(hasil.skorB1).toBe(100);
    expect(hasil.skorB2).toBe(100);
    expect(hasil.skorKomponenB).toBe(100);
  });

  // Test 13: Total IKA.04 & IKA.05
  it('13. Menghitung Total IKA.04 (4 x 0.25) dan IKA.05 (Indeks ASN)', () => {
    const total04 = hitungTotalIka04(80, 85, 90, 95);
    // (80 + 85 + 90 + 95) * 0.25 = 350 * 0.25 = 87.5
    expect(total04).toBe(87.5);

    const total05 = hitungTotalIka05(88.5);
    expect(total05).toBe(88.5);
  });

  // Test 14: Total IKA.06 (Akuntabilitas: SAKIP, IKPA, Kearsipan, BLU)
  it('14. Menghitung Total IKA.06 (SAKIP, IKPA, Kearsipan, BLU x 0.25)', () => {
    // SAKIP: 85, IKPA: 90, Kearsipan: 80, BLU: 4 (skala 5 -> 80)
    // Rata-rata = (85 + 90 + 80 + 80) * 0.25 = 335 * 0.25 = 83.75
    const total06 = hitungTotalIka06(85, 90, 80, 4);
    expect(total06).toBe(83.75);
  });

  // Test 15: IKA.02 Komponen A (Opsi B: Replika Eksak Bug Excel IF tanpa ELSE)
  it('15. Menghitung IKA.02 Komponen A (Opsi B: < 3 dapat bonus +1, >= 3 menghasilkan 0)', () => {
    // Skenario 1: Rata-rata < 3 (misal rata-rata 2.5 -> 2.5 + 1 = 3.5)
    const hasilDibawah3 = hitungIka02KomponenA([2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5]);
    expect(hasilDibawah3.rataRata).toBe(2.5);
    expect(hasilDibawah3.skorKomponenA).toBe(3.5);

    // Skenario 2: Rata-rata >= 3 (misal akreditasi baik 3.5) -> Menghasilkan 0 karena bug Excel tanpa ELSE
    const hasilDiatas3 = hitungIka02KomponenA([3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5]);
    expect(hasilDiatas3.rataRata).toBe(3.5);
    expect(hasilDiatas3.skorKomponenA).toBe(0);
  });

  // Test 16: IKA.02 Komponen B (Opsi B: Kasus Riil Poltekbang Makassar di Excel)
  it('16. Menghitung IKA.02 Komponen B (Opsi B: Poltekbang Makassar rata-rata persis 3.5 -> skor 0)', () => {
    // Kasus riil dari AGENTS.md §2.6: Poltekbang Makassar persis 3.5 -> menghasilkan 0
    const hasilMakassar = hitungIka02KomponenBPerUpt([3.5, 3.5, 3.5, 3.5]);
    expect(hasilMakassar.rataRata).toBe(3.5);
    expect(hasilMakassar.skorUpt).toBe(0);

    // Kasus rata-rata < 3.5 (misal 3.0 -> 3.0 + 0.5 = 3.5)
    const hasilLain = hitungIka02KomponenBPerUpt([3.0, 3.0, 3.0, 3.0]);
    expect(hasilLain.rataRata).toBe(3.0);
    expect(hasilLain.skorUpt).toBe(3.5);
  });

  // Test 17: Total IKA.02
  it('17. Menghitung Total IKA.02 (A 0.3 + B 0.3 + C 0.2 + D 0.2)', () => {
    // A: 3.5 (normalisasi ke skala 100 -> misal skorA = 87.5), B: 80, C: 75, D: 85
    // Total = 87.5*0.3 + 80*0.3 + 75*0.2 + 85*0.2 = 26.25 + 24 + 15 + 17 = 82.25
    const total02 = hitungTotalIka02(87.5, 80, 75, 85);
    expect(total02).toBe(82.25);
  });
});


