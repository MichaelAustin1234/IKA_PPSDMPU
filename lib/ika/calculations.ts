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

// ============================================================================
// MESIN KALKULASI POHON LENGKAP & GENERASI SNAPSHOT (F10)
// ============================================================================

export interface SnapshotItem {
  node_id: string;
  realisasi: number | null;
  skor_normalisasi: number | null;
  skor_terbobot: number | null;
}

export interface InputItemData {
  nilai_angka: number | null;
  predikat_id: string | null;
}

export interface NodeMetadata {
  id: string;
  parent_id: string | null;
  kode: string;
  nama: string;
  level: 'SKA' | 'IKA' | 'KOMPONEN' | 'SUB' | 'LEAF';
  bobot: number;
  tipe_input: 'ANGKA' | 'PREDIKAT' | 'TURUNAN';
  cap_100: boolean;
  min_nilai: number | null;
  max_nilai: number | null;
  max_ref_node_id: string | null;
  max_persen: number | null;
  urutan?: number;
}

/**
 * Menghitung seluruh node pohon dari data isian (laporan_isi) secara bottom-up.
 * Menghasilkan daftar record snapshot untuk disimpan ke tabel hasil_hitung.
 */
export function hitungSnapshotLaporan(
  allNodes: NodeMetadata[],
  inputMap: Record<string, InputItemData>,
  predikatMap: Record<string, number>
): SnapshotItem[] {
  const nodeMap = new Map<string, NodeMetadata>(allNodes.map((n) => [n.id, n]));
  const nodeByKode = new Map<string, NodeMetadata>(allNodes.map((n) => [n.kode, n]));

  // Kelompokkan children per parent_id
  const childrenMap = new Map<string, NodeMetadata[]>();
  allNodes.forEach((node) => {
    if (node.parent_id) {
      const arr = childrenMap.get(node.parent_id) || [];
      arr.push(node);
      childrenMap.set(node.parent_id, arr);
    }
  });

  const resultMap = new Map<string, SnapshotItem>();

  // Helper untuk mengambil nilai numerik mentah leaf node
  function getRawLeafValue(node: NodeMetadata): number | null {
    const input = inputMap[node.id];
    if (!input) return null;

    if (node.tipe_input === 'ANGKA') {
      return input.nilai_angka !== null && input.nilai_angka !== undefined ? Number(input.nilai_angka) : null;
    }
    if (node.tipe_input === 'PREDIKAT' && input.predikat_id) {
      return predikatMap[input.predikat_id] ?? null;
    }
    return null;
  }

  // 1. Evaluasi seluruh LEAF nodes terlebih dahulu
  allNodes
    .filter((n) => n.level === 'LEAF')
    .forEach((leaf) => {
      const rawVal = getRawLeafValue(leaf);
      let normalSkor: number | null = null;

      if (rawVal !== null) {
        // Tentukan nilai max (apakah dinamis atau statis)
        let maxVal = leaf.max_nilai ?? 100;
        if (leaf.max_ref_node_id && leaf.max_persen) {
          const refNode = nodeMap.get(leaf.max_ref_node_id);
          const refVal = refNode ? getRawLeafValue(refNode) ?? 0 : 0;
          maxVal = hitungBatasMaxDinamis(refVal, leaf.max_persen);
        }

        const minVal = leaf.min_nilai ?? 0;
        normalSkor = hitungNormalisasi(rawVal, minVal, maxVal, leaf.cap_100);
      }

      const bobot = Number(leaf.bobot) || 0;
      const skorTerbobot = normalSkor !== null ? Math.round(normalSkor * bobot * 100) / 100 : null;

      resultMap.set(leaf.id, {
        node_id: leaf.id,
        realisasi: rawVal,
        skor_normalisasi: normalSkor,
        skor_terbobot: skorTerbobot,
      });
    });

  // 2. Evaluasi node rekursif bottom-up untuk SUB, KOMPONEN, IKA, dan SKA
  function evaluateNode(nodeId: string): SnapshotItem {
    if (resultMap.has(nodeId)) {
      return resultMap.get(nodeId)!;
    }

    const node = nodeMap.get(nodeId);
    if (!node) {
      return { node_id: nodeId, realisasi: null, skor_normalisasi: null, skor_terbobot: null };
    }

    // Tangani kasus khusus formula terprogram
    if (node.kode === 'A.1') {
      const lulusNode = nodeByKode.get('A_LULUS');
      const tepatNode = nodeByKode.get('A_TEPAT');
      const lulusVal = lulusNode ? getRawLeafValue(lulusNode) : null;
      const tepatVal = tepatNode ? getRawLeafValue(tepatNode) : null;

      if (lulusVal && lulusVal > 0 && tepatVal !== null) {
        const realisasi = (tepatVal / lulusVal) * 100;
        const skorNormal = hitungNormalisasi(realisasi, 0, 100, true);
        const bobot = Number(node.bobot) || 0.6;
        const res: SnapshotItem = {
          node_id: node.id,
          realisasi: Math.round(realisasi * 100) / 100,
          skor_normalisasi: skorNormal,
          skor_terbobot: Math.round(skorNormal * bobot * 100) / 100,
        };
        resultMap.set(node.id, res);
        return res;
      }
    }

    if (node.kode === 'A.2') {
      const lulusNode = nodeByKode.get('A_LULUS');
      const ipk35Node = nodeByKode.get('A_IPK_35');
      const ipk30Node = nodeByKode.get('A_IPK_30');
      const lulusVal = lulusNode ? getRawLeafValue(lulusNode) : null;
      const ipk35 = ipk35Node ? getRawLeafValue(ipk35Node) ?? 0 : 0;
      const ipk30 = ipk30Node ? getRawLeafValue(ipk30Node) ?? 0 : 0;

      if (lulusVal && lulusVal > 0) {
        const realisasi = ((ipk35 + ipk30) / lulusVal) * 100;
        const skorNormal = hitungNormalisasi(realisasi, 80, 100, true);
        const bobot = Number(node.bobot) || 0.4;
        const res: SnapshotItem = {
          node_id: node.id,
          realisasi: Math.round(realisasi * 100) / 100,
          skor_normalisasi: skorNormal,
          skor_terbobot: Math.round(skorNormal * bobot * 100) / 100,
        };
        resultMap.set(node.id, res);
        return res;
      }
    }

    // Kasus Komponen C IKA.01 (aturan cap jika C.1 >= 100)
    if (node.kode === 'C' && node.level === 'KOMPONEN') {
      const c1Node = nodeByKode.get('C.1');
      const c1Snap = c1Node ? evaluateNode(c1Node.id) : null;
      const children = childrenMap.get(node.id) || [];
      const childSnaps = children.map((c) => evaluateNode(c.id));

      if (c1Snap && c1Snap.skor_normalisasi !== null && c1Snap.skor_normalisasi >= 100) {
        const bobot = Number(node.bobot) || 0.3;
        const res: SnapshotItem = {
          node_id: node.id,
          realisasi: 100,
          skor_normalisasi: 100,
          skor_terbobot: Math.round(100 * bobot * 100) / 100,
        };
        resultMap.set(node.id, res);
        return res;
      }

      // Normal akumulasi terbobot
      let sumSkor = 0;
      let hasData = false;
      childSnaps.forEach((cs) => {
        if (cs.skor_terbobot !== null) {
          sumSkor += cs.skor_terbobot;
          hasData = true;
        }
      });

      const normalSkor = hasData ? Math.min(100, Math.round(sumSkor * 100) / 100) : null;
      const bobot = Number(node.bobot) || 0.3;
      const res: SnapshotItem = {
        node_id: node.id,
        realisasi: normalSkor,
        skor_normalisasi: normalSkor,
        skor_terbobot: normalSkor !== null ? Math.round(normalSkor * bobot * 100) / 100 : null,
      };
      resultMap.set(node.id, res);
      return res;
    }

    // Default agregasi rekursif: Nilai parent = jumlah skor terbobot seluruh anak-anaknya
    const children = childrenMap.get(node.id) || [];
    if (children.length === 0) {
      // Leaf yang belum dievaluasi
      const rawVal = getRawLeafValue(node);
      const res: SnapshotItem = {
        node_id: node.id,
        realisasi: rawVal,
        skor_normalisasi: rawVal,
        skor_terbobot: rawVal !== null ? Math.round(rawVal * Number(node.bobot) * 100) / 100 : null,
      };
      resultMap.set(node.id, res);
      return res;
    }

    const childSnaps = children.map((c) => evaluateNode(c.id));
    let sumSkor = 0;
    let hasData = false;

    // Cek apakah anak-anaknya memiliki bobot total > 0
    const totalChildWeight = children.reduce((acc, c) => acc + (Number(c.bobot) || 0), 0);

    if (totalChildWeight > 0) {
      childSnaps.forEach((cs) => {
        if (cs.skor_terbobot !== null) {
          sumSkor += cs.skor_terbobot;
          hasData = true;
        }
      });
    } else {
      // Jika bobot anak = 0 (misalnya prodi atau leaf rata-rata), gunakan rata-rata sederhana
      const validSnaps = childSnaps.filter((cs) => cs.skor_normalisasi !== null);
      if (validSnaps.length > 0) {
        sumSkor = validSnaps.reduce((acc, cs) => acc + (cs.skor_normalisasi || 0), 0) / validSnaps.length;
        hasData = true;
      }
    }

    let finalNormal = hasData ? Math.round(sumSkor * 100) / 100 : null;
    if (finalNormal !== null && node.cap_100 && finalNormal > 100) {
      finalNormal = 100;
    }

    const bobot = Number(node.bobot) || 1.0;
    const skorTerbobot = finalNormal !== null ? Math.round(finalNormal * bobot * 100) / 100 : null;

    const res: SnapshotItem = {
      node_id: node.id,
      realisasi: finalNormal,
      skor_normalisasi: finalNormal,
      skor_terbobot: skorTerbobot,
    };
    resultMap.set(node.id, res);
    return res;
  }

  // Evaluasi seluruh node pohon
  allNodes.forEach((node) => {
    evaluateNode(node.id);
  });

  return Array.from(resultMap.values());
}



