import fs from 'fs';
import path from 'path';

interface UptInfo {
  kode: string;
  nama: string;
  jenis: 'POLITEKNIK' | 'AKADEMI' | 'BALAI' | 'PUSAT';
}

const UPT_LIST: UptInfo[] = [
  { kode: 'PPIC', nama: 'Politeknik Penerbangan Indonesia Curug', jenis: 'POLITEKNIK' },
  { kode: 'POLTEKBANG_SBY', nama: 'Politeknik Penerbangan Surabaya', jenis: 'POLITEKNIK' },
  { kode: 'POLTEKBANG_MDN', nama: 'Politeknik Penerbangan Medan', jenis: 'POLITEKNIK' },
  { kode: 'POLTEKBANG_MKS', nama: 'Politeknik Penerbangan Makassar', jenis: 'POLITEKNIK' },
  { kode: 'POLTEKBANG_PLB', nama: 'Politeknik Penerbangan Palembang', jenis: 'POLITEKNIK' },
  { kode: 'POLTEKBANG_JYP', nama: 'Politeknik Penerbangan Jayapura', jenis: 'POLITEKNIK' },
  { kode: 'API_BANYUWANGI', nama: 'Akademi Penerbang Indonesia Banyuwangi', jenis: 'AKADEMI' },
  { kode: 'BP3_CURUG', nama: 'Balai Pendidikan dan Pelatihan Penerbangan Curug', jenis: 'BALAI' },
];

interface LeafRule {
  path: string;
  kode: string;
  nama: string;
  ika: string;
  applicableUpts: string[];
  keterangan: string;
}

// Baca kamus data CSV untuk mendapatkan daftar 113 leaf resmi
function getCanonicalLeavesFromCsv(): { ika: string; kode: string; nama: string; baris: string }[] {
  const csvRaw = fs.readFileSync(path.resolve(process.cwd(), 'kamus_data_leaf_node_ika.csv'), 'utf-8');
  const lines = csvRaw.split('\n').filter(l => l.trim().length > 0);
  const leaves: { ika: string; kode: string; nama: string; baris: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    let cur = '';
    let inQuotes = false;
    const parts: string[] = [];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    parts.push(cur.trim());
    const ika = parts[0];
    const kode = parts[1];
    const nama = (parts[2] || '').replace(/^"|"$/g, '').trim();
    const tipe = parts[3];
    const baris = parts[10];

    // Filter hanya leaf node murni (ANGKA, PREDIKAT, atau leaf khusus tanpa agregat)
    if (tipe === 'ANGKA' || tipe === 'PREDIKAT' || (tipe === 'TURUNAN' && ika === 'IKA.03' && kode.startsWith('C.'))) {
      // Kecualikan baris header sasaran/agregat
      if (nama && !nama.startsWith('Meningkat') && !nama.startsWith('Terwujud') && !nama.startsWith('Indeks')) {
        leaves.push({ ika, kode, nama, baris });
      }
    }
  }
  return leaves;
}

async function main() {
  console.log('====================================================================');
  console.log('EKSTRAKSI MATRIKS KETERCAKUPAN UPT (NODE_UPT) DARI EXCEL CAPKIN');
  console.log('====================================================================\n');

  console.log('Daftar 8 UPT yang Terdaftar di Sistem:');
  UPT_LIST.forEach((u, i) => console.log(`  ${i + 1}. [${u.kode}] ${u.nama} (${u.jenis})`));
  console.log('');

  const VOKASI_7 = ['PPIC', 'POLTEKBANG_SBY', 'POLTEKBANG_MDN', 'POLTEKBANG_MKS', 'POLTEKBANG_PLB', 'POLTEKBANG_JYP', 'API_BANYUWANGI'];
  const SEMUA_8 = ['PPIC', 'POLTEKBANG_SBY', 'POLTEKBANG_MDN', 'POLTEKBANG_MKS', 'POLTEKBANG_PLB', 'POLTEKBANG_JYP', 'API_BANYUWANGI', 'BP3_CURUG'];

  const rules: { ika: string; pattern: string; upts: string[]; keterangan: string }[] = [
    // IKA.01
    { ika: 'IKA.01', pattern: 'Komponen A (Tingkat Kelulusan: A_LULUS, A_TEPAT, IPK)', upts: VOKASI_7, keterangan: 'Hanya UPT Pendidikan Vokasi (BP3 Curug adalah Balai Pelatihan non-gelar -> N/A)' },
    { ika: 'IKA.01', pattern: 'Komponen B.1 (Sertifikasi Lulusan Pendidikan)', upts: VOKASI_7, keterangan: 'Hanya UPT Pendidikan Vokasi (BP3 Curug -> N/A)' },
    { ika: 'IKA.01', pattern: 'Komponen B.2 (Pelatihan Teknis: B2_PESERTA, Sertifikasi Teknis)', upts: SEMUA_8, keterangan: 'Semua 8 UPT (Politeknik, Akademi, dan Balai Diklat menyelenggarakan pelatihan teknis)' },
    { ika: 'IKA.01', pattern: 'Komponen C (Tingkat Penyerapan Lulusan: C.1 s.d C.6)', upts: VOKASI_7, keterangan: 'Hanya UPT Pendidikan Vokasi (BP3 Curug -> N/A)' },
    { ika: 'IKA.01', pattern: 'Komponen D (Kepuasan Pengguna Lulusan: D.1, D.2, D.3)', upts: VOKASI_7, keterangan: 'Hanya UPT Pendidikan Vokasi (BP3 Curug -> N/A)' },

    // IKA.02
    { ika: 'IKA.02', pattern: 'A.1 (Akreditasi Institusi PPI Curug)', upts: ['PPIC'], keterangan: 'Hanya PPIC' },
    { ika: 'IKA.02', pattern: 'A.2 (Akreditasi Institusi Poltekbang Surabaya)', upts: ['POLTEKBANG_SBY'], keterangan: 'Hanya Poltekbang SBY' },
    { ika: 'IKA.02', pattern: 'A.3 (Akreditasi Institusi Poltekbang Medan)', upts: ['POLTEKBANG_MDN'], keterangan: 'Hanya Poltekbang MDN' },
    { ika: 'IKA.02', pattern: 'A.4 (Akreditasi Institusi Poltekbang Makassar)', upts: ['POLTEKBANG_MKS'], keterangan: 'Hanya Poltekbang MKS' },
    { ika: 'IKA.02', pattern: 'A.5 (Akreditasi Institusi Poltekbang Palembang)', upts: ['POLTEKBANG_PLB'], keterangan: 'Hanya Poltekbang PLB' },
    { ika: 'IKA.02', pattern: 'A.6 (Akreditasi Institusi Poltekbang Jayapura)', upts: ['POLTEKBANG_JYP'], keterangan: 'Hanya Poltekbang JYP' },
    { ika: 'IKA.02', pattern: 'A.7 (Akreditasi Institusi API Banyuwangi)', upts: ['API_BANYUWANGI'], keterangan: 'Hanya API Banyuwangi' },
    { ika: 'IKA.02', pattern: 'B.1 (Prodi PPI Curug - 8 prodi)', upts: ['PPIC'], keterangan: 'Hanya PPIC' },
    { ika: 'IKA.02', pattern: 'B.2 (Prodi Poltekbang Surabaya - 7 prodi)', upts: ['POLTEKBANG_SBY'], keterangan: 'Hanya Poltekbang SBY' },
    { ika: 'IKA.02', pattern: 'B.3 (Prodi Poltekbang Medan - 4 prodi)', upts: ['POLTEKBANG_MDN'], keterangan: 'Hanya Poltekbang MDN' },
    { ika: 'IKA.02', pattern: 'B.4 (Prodi Poltekbang Makassar - 4 prodi)', upts: ['POLTEKBANG_MKS'], keterangan: 'Hanya Poltekbang MKS' },
    { ika: 'IKA.02', pattern: 'B.5 (Prodi Poltekbang Palembang - 3 prodi)', upts: ['POLTEKBANG_PLB'], keterangan: 'Hanya Poltekbang PLB' },
    { ika: 'IKA.02', pattern: 'B.6 (Prodi Poltekbang Jayapura - 1 prodi)', upts: ['POLTEKBANG_JYP'], keterangan: 'Hanya Poltekbang JYP' },
    { ika: 'IKA.02', pattern: 'B.7 (Prodi API Banyuwangi - 2 prodi)', upts: ['API_BANYUWANGI'], keterangan: 'Hanya API Banyuwangi' },
    { ika: 'IKA.02', pattern: 'Komponen C (Sertifikasi Program Pelatihan: C.1, C.2)', upts: SEMUA_8, keterangan: 'Semua 8 UPT' },
    { ika: 'IKA.02', pattern: 'Komponen D (Sertifikasi Tenaga Kerja: D.1.1, D.1.2, D.2)', upts: SEMUA_8, keterangan: 'Semua 8 UPT' },

    // IKA.03
    { ika: 'IKA.03', pattern: 'Seluruh 10 Leaf (Kebijakan SDM Transportasi Udara)', upts: ['PUSAT / PPSDMPU'], keterangan: 'Indeks Kebijakan Sektor Udara milik Pusat (PPSDMPU). UPT tidak menginput kebijakan ini.' },

    // IKA.04
    { ika: 'IKA.04', pattern: 'Komponen A (Kepuasan Peserta Didik: A.1, A.2)', upts: SEMUA_8, keterangan: 'Semua 8 UPT menyelenggarakan survei kepuasan peserta didik/diklat' },
    { ika: 'IKA.04', pattern: 'Komponen B (Tenaga Pendidik: B.1, B.2, B.3)', upts: SEMUA_8, keterangan: 'Semua 8 UPT (Dosen untuk Politeknik/Akademi, Instruktur untuk Balai Diklat)' },
    { ika: 'IKA.04', pattern: 'Komponen C (Sarana Prasarana: C.1.1, C.1.2, C.2.1, C.2.2)', upts: SEMUA_8, keterangan: 'Semua 8 UPT menginput fasilitas utama & penunjang' },
    { ika: 'IKA.04', pattern: 'Komponen D (Standar Mutu ISO/Audit: D.1 s.d D.4)', upts: ['PUSAT / AGREGAT'], keterangan: 'Diinput Pusat berdasarkan capaian kepatuhan standar mutu 9 satker' },

    // IKA.05
    { ika: 'IKA.05', pattern: 'IKA.05.1 (IP ASN Pusat PPSDMPU)', upts: ['PUSAT / PPSDMPU'], keterangan: 'Pusat PPSDMPU' },
    { ika: 'IKA.05', pattern: 'IKA.05.2 (IP ASN PPI Curug)', upts: ['PPIC'], keterangan: 'PPI Curug' },
    { ika: 'IKA.05', pattern: 'IKA.05.3 (IP ASN Poltekbang Surabaya)', upts: ['POLTEKBANG_SBY'], keterangan: 'Poltekbang Surabaya' },
    { ika: 'IKA.05', pattern: 'IKA.05.4 (IP ASN Poltekbang Medan)', upts: ['POLTEKBANG_MDN'], keterangan: 'Poltekbang Medan' },
    { ika: 'IKA.05', pattern: 'IKA.05.5 (IP ASN Poltekbang Makassar)', upts: ['POLTEKBANG_MKS'], keterangan: 'Poltekbang Makassar' },
    { ika: 'IKA.05', pattern: 'IKA.05.6 (IP ASN Poltekbang Palembang)', upts: ['POLTEKBANG_PLB'], keterangan: 'Poltekbang Palembang' },
    { ika: 'IKA.05', pattern: 'IKA.05.7 (IP ASN Poltekbang Jayapura)', upts: ['POLTEKBANG_JYP'], keterangan: 'Poltekbang Jayapura' },
    { ika: 'IKA.05', pattern: 'IKA.05.8 (IP ASN API Banyuwangi)', upts: ['API_BANYUWANGI'], keterangan: 'API Banyuwangi' },
    { ika: 'IKA.05', pattern: 'IKA.05.9 (IP ASN BP3 Curug)', upts: ['BP3_CURUG'], keterangan: 'BP3 Curug' },

    // IKA.06
    { ika: 'IKA.06', pattern: 'Seluruh 15 Leaf (Akuntabilitas: SAKIP, IKPA, Kearsipan, BLU)', upts: SEMUA_8, keterangan: 'Semua 8 UPT + Pusat memiliki nilai akuntabilitas unit kerja masing-masing' },
  ];

  console.log('| IKA | Grup Indikator / Komponen | UPT yang Berlaku | Keterangan Logika Excel |');
  console.log('|---|---|---|---|');
  rules.forEach(r => {
    console.log(`| **${r.ika}** | ${r.pattern} | \`${r.upts.join(', ')}\` | ${r.keterangan} |`);
  });
}

main().catch(console.error);
