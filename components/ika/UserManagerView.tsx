'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  resetUserPasswordAction,
} from '@/app/actions/admin';
import {
  Users,
  KeyRound,
  ShieldCheck,
  Building2,
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Plus,
  Pencil,
  Trash2,
  Mail,
  User,
} from 'lucide-react';
import type { UserRole, Upt } from '@/lib/types';

export interface AdminUserItem {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  uptId?: string | null;
  uptNama?: string;
  uptKode?: string;
  lastSignInAt?: string | null;
  createdAt?: string;
}

interface UserManagerViewProps {
  users: AdminUserItem[];
  uptList: Upt[];
  currentUserId: string;
}

export function UserManagerView({ users, uptList, currentUserId }: UserManagerViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [resetUser, setResetUser] = useState<AdminUserItem | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserItem | null>(null);

  // Form Fields for Create
  const [createNama, setCreateNama] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('ADMIN_UPT');
  const [createUptId, setCreateUptId] = useState<string>(uptList[0]?.id || '');

  // Form Fields for Edit
  const [editNama, setEditNama] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('ADMIN_UPT');
  const [editUptId, setEditUptId] = useState<string>('');

  // Form Fields for Reset Password
  const [newPassword, setNewPassword] = useState('');

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.nama.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.uptKode && u.uptKode.toLowerCase().includes(q)) ||
      (u.uptNama && u.uptNama.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  // Open Handlers
  const handleOpenCreate = () => {
    setCreateNama('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('ADMIN_UPT');
    setCreateUptId(uptList[0]?.id || '');
    setModalFeedback(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: AdminUserItem) => {
    setEditUser(user);
    setEditNama(user.nama);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditUptId(user.uptId || uptList[0]?.id || '');
    setModalFeedback(null);
  };

  const handleOpenReset = (user: AdminUserItem) => {
    setResetUser(user);
    setNewPassword('');
    setModalFeedback(null);
  };

  const handleOpenDelete = (user: AdminUserItem) => {
    setDeleteUser(user);
    setModalFeedback(null);
  };

  // Close All Modals
  const handleCloseModals = () => {
    setIsCreateOpen(false);
    setEditUser(null);
    setResetUser(null);
    setDeleteUser(null);
    setModalFeedback(null);
    setIsSubmitting(false);
  };

  // Submit Handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalFeedback(null);

    const res = await createUserAction({
      nama: createNama,
      email: createEmail,
      password: createPassword,
      role: createRole,
      uptId: createRole === 'ADMIN_UPT' ? createUptId : null,
    });

    setIsSubmitting(false);
    if (res.success) {
      setModalFeedback({
        type: 'success',
        message: `Akun baru ${createEmail} berhasil dibuat!`,
      });
      setTimeout(() => {
        handleCloseModals();
        router.refresh();
      }, 1200);
    } else {
      setModalFeedback({
        type: 'error',
        message: res.error || 'Gagal membuat pengguna baru.',
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setIsSubmitting(true);
    setModalFeedback(null);

    const res = await updateUserAction({
      userId: editUser.id,
      nama: editNama,
      email: editEmail,
      role: editRole,
      uptId: editRole === 'ADMIN_UPT' ? editUptId : null,
    });

    setIsSubmitting(false);
    if (res.success) {
      setModalFeedback({
        type: 'success',
        message: `Data pengguna ${editEmail} berhasil diperbarui!`,
      });
      setTimeout(() => {
        handleCloseModals();
        router.refresh();
      }, 1200);
    } else {
      setModalFeedback({
        type: 'error',
        message: res.error || 'Gagal memperbarui pengguna.',
      });
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    if (!newPassword || newPassword.length < 6) {
      setModalFeedback({ type: 'error', message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback(null);

    const res = await resetUserPasswordAction(resetUser.id, newPassword);

    setIsSubmitting(false);
    if (res.success) {
      setModalFeedback({
        type: 'success',
        message: `Kata sandi untuk ${resetUser.email} berhasil diperbarui!`,
      });
      setTimeout(() => {
        handleCloseModals();
        router.refresh();
      }, 1200);
    } else {
      setModalFeedback({
        type: 'error',
        message: res.error || 'Gagal mereset kata sandi.',
      });
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteUser) return;

    setIsSubmitting(true);
    setModalFeedback(null);

    const res = await deleteUserAction(deleteUser.id);

    setIsSubmitting(false);
    if (res.success) {
      setModalFeedback({
        type: 'success',
        message: `Akun ${deleteUser.email} berhasil dihapus dari sistem!`,
      });
      setTimeout(() => {
        handleCloseModals();
        router.refresh();
      }, 1200);
    } else {
      setModalFeedback({
        type: 'error',
        message: res.error || 'Gagal menghapus pengguna.',
      });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60">
            <ShieldCheck className="w-3 h-3" /> Super Admin
          </span>
        );
      case 'ADMIN_PUSAT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60">
            <Building2 className="w-3 h-3" /> Admin Pusat
          </span>
        );
      case 'ADMIN_UPT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
            <Building2 className="w-3 h-3" /> Admin UPT
          </span>
        );
      case 'PIMPINAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
            <UserCheck className="w-3 h-3" /> Pimpinan
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Manajemen Pengguna & Akun
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola pembuatan, pembaruan profil, hak akses, dan penghapusan akun sistem IKA
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Button Tambah Pengguna Baru (Create) */}
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Daftar Akun Terdaftar ({filteredUsers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Satuan Kerja / UPT</th>
                <th className="py-3 px-4 text-right">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{u.nama}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {u.uptNama ? (
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {u.uptKode}
                          </span>
                          <span>{u.uptNama}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pusat / PPSDMPU</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                          title="Ubah profil / role"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleOpenReset(u)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 transition-colors"
                          title="Reset kata sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        {!isSelf ? (
                          <button
                            onClick={() => handleOpenDelete(u)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 transition-colors"
                            title="Hapus pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div className="w-6.5" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: TAMBAH PENGGUNA BARU (CREATE)                        */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tambah Pengguna Baru
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Daftarkan akun kedinasan dan tetapkan peran akses
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModals}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Pegawai
                </label>
                <input
                  type="text"
                  required
                  value={createNama}
                  onChange={(e) => setCreateNama(e.target.value)}
                  placeholder="Contoh: Admin PPI Curug"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Email Kedinasan
                </label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="admin.upt@ppsdmpu.go.id"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi Awal
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peran / Hak Akses
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                >
                  <option value="ADMIN_UPT">ADMIN_UPT (Admin Kampus / Satker)</option>
                  <option value="ADMIN_PUSAT">ADMIN_PUSAT (Admin Perencanaan PPSDMPU)</option>
                  <option value="PIMPINAN">PIMPINAN (Direktur / Pejabat Struktural)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Administrator IT & Sistem)</option>
                </select>
              </div>

              {createRole === 'ADMIN_UPT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satuan Kerja (UPT)
                  </label>
                  <select
                    value={createUptId}
                    onChange={(e) => setCreateUptId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    {uptList.map((upt) => (
                      <option key={upt.id} value={upt.id}>
                        {upt.kode} - {upt.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    modalFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60'
                  }`}
                >
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{modalFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Mendaftarkan...' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: UBAH DATA PENGGUNA (UPDATE)                          */}
      {/* ============================================================== */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ubah Data Pengguna
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModals}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Pegawai
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Email Kedinasan
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peran / Hak Akses
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                >
                  <option value="ADMIN_UPT">ADMIN_UPT (Admin Kampus / Satker)</option>
                  <option value="ADMIN_PUSAT">ADMIN_PUSAT (Admin Perencanaan PPSDMPU)</option>
                  <option value="PIMPINAN">PIMPINAN (Direktur / Pejabat Struktural)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Administrator IT & Sistem)</option>
                </select>
              </div>

              {editRole === 'ADMIN_UPT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Satuan Kerja (UPT)
                  </label>
                  <select
                    value={editUptId}
                    onChange={(e) => setEditUptId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    {uptList.map((upt) => (
                      <option key={upt.id} value={upt.id}>
                        {upt.kode} - {upt.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    modalFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60'
                  }`}
                >
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{modalFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: RESET KATA SANDI                                     */}
      {/* ============================================================== */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Reset Kata Sandi
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                    {resetUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModals}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {modalFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    modalFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60'
                  }`}
                >
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{modalFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: HAPUS PENGGUNA (DELETE)                               */}
      {/* ============================================================== */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Hapus Pengguna
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Konfirmasi penghapusan akun
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModals}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDeleteSubmit} className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300">
                <p className="font-semibold mb-1">Perhatian Tindakan Permanen!</p>
                <p className="leading-relaxed">
                  Akun <strong>{deleteUser.nama}</strong> ({deleteUser.email}) akan dihapus secara permanen dari sistem IKA. Pengguna ini tidak akan bisa login kembali.
                </p>
              </div>

              {modalFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    modalFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60'
                  }`}
                >
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{modalFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menghapus...' : 'Ya, Hapus Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
