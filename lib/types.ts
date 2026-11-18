// lib/types.ts
// Tipe data terpusat sistem IKA PPSDMPU sesuai skema PostgreSQL (0001_init_schema.sql)

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_PUSAT' | 'ADMIN_UPT' | 'PIMPINAN';

export interface Upt {
  id: string;
  kode: string;
  nama: string;
}

export interface Profile {
  id: string;
  nama: string;
  role: UserRole;
  upt_id: string | null;
  created_at?: string;
  upt?: Upt;
}

export type NodeLevel = 'SKA' | 'IKA' | 'KOMPONEN' | 'SUB' | 'LEAF';
export type TipeInput = 'ANGKA' | 'PREDIKAT' | 'TURUNAN';

export interface IndikatorNode {
  id: string;
  parent_id: string | null;
  kode: string;
  nama: string;
  level: NodeLevel;
  bobot: number;
  tipe_input: TipeInput;
  cap_100: boolean;
  min_nilai: number | null;
  max_nilai: number | null;
  max_ref_node_id: string | null;
  max_persen: number | null;
  urutan: number;
  catatan: string | null;
  children?: IndikatorNode[];
}

export interface PredikatKonversi {
  id: string;
  jenis: string;
  predikat: string;
  skor: number;
}

export interface Periode {
  id: string;
  tahun: number;
  triwulan: number; // 1-4
  status: 'BUKA' | 'TUTUP';
}

export type StatusLaporan = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Laporan {
  id: string;
  upt_id: string;
  periode_id: string;
  status: StatusLaporan;
  submitted_at: string | null;
  reviewed_by: string | null;
  catatan: string | null;
  created_at?: string;
  updated_at?: string;
  upt?: Upt;
  periode?: Periode;
}

export interface LaporanIsi {
  id: string;
  laporan_id: string;
  node_id: string;
  nilai_angka: number | null;
  predikat_id: string | null;
  sumber: 'MANUAL' | 'API';
  keterangan: string | null;
  updated_at?: string;
}

export interface HasilHitung {
  id: string;
  laporan_id: string;
  node_id: string;
  realisasi: number | null;
  skor_normalisasi: number | null;
  skor_terbobot: number | null;
  dihitung_pada?: string;
  node?: IndikatorNode;
}
