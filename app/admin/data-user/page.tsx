'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
// import Link from 'next/link';

interface UserProfile {
  id: string;
  nama: string;
  email: string;
  role: string;
  kelurahan_id: string;
  kelurahan?: {
    name: string;
  } | null;
}

export default function DataUserPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kelurahanList, setKelurahanList] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ nama: '', email: '', password: '', role: 'admin kecamatan', kelurahan_id: '' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editUser, setEditUser] = useState({ nama: '', email: '', role: 'admin kecamatan', kelurahan_id: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nama, email, role, kelurahan_id')
        .order('nama', { ascending: true });

      if (profilesError) {
        setError(profilesError.message);
        return;
      }

      const { data: kelurahans } = await supabase
        .from('kelurahan')
        .select('id, name');

      setKelurahanList(kelurahans || []);

      const kelMap = new Map<string, string>();
      (kelurahans || []).forEach((k: any) => kelMap.set(String(k.id), k.name));

      const mapped = (profiles || []).map((p: any) => ({
        id: p.id,
        nama: p.nama,
        email: p.email,
        role: p.role,
        kelurahan_id: String(p.kelurahan_id ?? ''),
        kelurahan: { name: kelMap.get(String(p.kelurahan_id)) || '' },
      }));

      setUsers(mapped as UserProfile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setNewUser({ nama: '', email: '', password: '', role: 'admin kecamatan', kelurahan_id: kelurahanList[0]?.id ? String(kelurahanList[0].id) : '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleNewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditUser(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = (user: UserProfile) => {
    console.log('openEditModal called for', user?.id);
    setEditingId(user.id);
    setEditUser({ nama: user.nama || '', email: user.email || '', role: user.role || 'admin kecamatan', kelurahan_id: String(user.kelurahan_id || '') });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingId(null);
  };

  // debug: log when edit modal state changes
  useEffect(() => {
    console.log('isEditModalOpen state:', isEditModalOpen);
  }, [isEditModalOpen]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) {
      alert('ID user tidak ditemukan');
      return;
    }
    setEditing(true);
    try {
      if (!editUser.nama.trim() || !editUser.email.trim() || !editUser.kelurahan_id) {
        alert('Semua field harus diisi');
        setEditing(false);
        return;
      }

      const kelId = editUser.kelurahan_id ? Number(editUser.kelurahan_id) : null;

      const { error } = await supabase
        .from('profiles')
        .update({ nama: editUser.nama, email: editUser.email, role: editUser.role, kelurahan_id: kelId })
        .eq('id', editingId);

      if (error) {
        alert('Gagal memperbarui profile: ' + error.message);
        setEditing(false);
        return;
      }

      alert('User berhasil diperbarui');
      closeEditModal();
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setEditing(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      if (!newUser.nama.trim() || !newUser.email.trim() || !newUser.password.trim() || !newUser.kelurahan_id) {
        alert('Semua field harus diisi');
        setCreating(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: { data: { nama: newUser.nama, role: newUser.role, kelurahan_id: newUser.kelurahan_id } },
      });

      if (authError) {
        alert('Gagal membuat user: ' + authError.message);
        setCreating(false);
        return;
      }

      // If user id returned, insert profile
      const userId = authData?.user?.id;
      if (userId) {
        const kelId = newUser.kelurahan_id ? Number(newUser.kelurahan_id) : null;

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: userId,
              nama: newUser.nama,
              email: newUser.email,
              role: newUser.role,
              kelurahan_id: kelId,
            },
          ], { onConflict: 'id' });

        if (profileError) {
          alert('User terbuat di Auth, tapi gagal menyimpan profile: ' + profileError.message);
          setCreating(false);
          return;
        }
      }

      alert('User berhasil dibuat');
      closeModal();
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);

        if (error) {
          alert('Gagal menghapus profile: ' + error.message);
          return;
        }

        setUsers(prev => prev.filter(user => user.id !== id));
        alert('Profile berhasil dihapus');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Data User</h2>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Manajemen data pengguna aplikasi.</p>
        </div>
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          + Tambah User
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Edit User</h3>
              <button onClick={closeEditModal} className="text-zinc-600 dark:text-zinc-300">Tutup</button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Nama</label>
                <input name="nama" value={editUser.nama} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Email</label>
                <input type="email" name="email" value={editUser.email} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Role</label>
                <select name="role" value={editUser.role} onChange={handleEditChange} className="w-full px-3 py-2 border rounded">
                  <option value="admin kecamatan">admin kecamatan</option>
                  <option value="admin kelurahan">admin kelurahan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Kelurahan</label>
                <select name="kelurahan_id" value={editUser.kelurahan_id} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" required>
                  <option value="">-- Pilih Kelurahan --</option>
                  {kelurahanList.map(k => (
                    <option key={k.id} value={String(k.id)}>{k.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 bg-zinc-200 rounded">Batal</button>
                <button type="submit" disabled={editing} className="px-4 py-2 bg-blue-600 text-white rounded">{editing ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Tambah User</h3>
              <button onClick={closeModal} className="text-zinc-600 dark:text-zinc-300">Tutup</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Nama</label>
                <input name="nama" value={newUser.nama} onChange={handleNewChange} className="w-full px-3 py-2 border rounded" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Email</label>
                <input type="email" name="email" value={newUser.email} onChange={handleNewChange} className="w-full px-3 py-2 border rounded" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Password</label>
                <input type="password" name="password" value={newUser.password} onChange={handleNewChange} className="w-full px-3 py-2 border rounded" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Role</label>
                <select name="role" value={newUser.role} onChange={handleNewChange} className="w-full px-3 py-2 border rounded">
                  <option value="admin kecamatan">admin kecamatan</option>
                  <option value="admin kelurahan">admin kelurahan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Kelurahan</label>
                <select name="kelurahan_id" value={newUser.kelurahan_id} onChange={handleNewChange} className="w-full px-3 py-2 border rounded" required>
                  <option value="">-- Pilih Kelurahan --</option>
                  {kelurahanList.map(k => (
                    <option key={k.id} value={String(k.id)}>{k.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-zinc-200 rounded">Batal</button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded">{creating ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-zinc-600 dark:text-zinc-400">Memuat data...</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">No.</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kelurahan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-600 dark:text-zinc-400">
                    Tidak ada data user
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                      {user.nama || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                      {user.kelurahan?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}