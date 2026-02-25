'use client';

import { useState } from 'react';
import { createClient } from '../../../utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Kelurahan {
  id: number;
  name: string;
}

export default function KelurahanManager({ initialData }: { initialData: Kelurahan[] }) {
  const [kelurahanList, setKelurahanList] = useState<Kelurahan[]>(initialData);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentKelurahan, setCurrentKelurahan] = useState<Kelurahan | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('kelurahan')
      .insert([{ name: formData.name }])
      .select();

    if (error) {
      setError(error.message);
    } else {
      if (data) {
        setKelurahanList([...kelurahanList, ...data]);
      }
      setIsAddModalOpen(false);
      setFormData({ name: '' });
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentKelurahan) return;
    setIsLoading(true);
    setError(null);

    const { error } = await supabase
      .from('kelurahan')
      .update({ name: formData.name })
      .eq('id', currentKelurahan.id);

    if (error) {
      setError(error.message);
    } else {
      setKelurahanList(kelurahanList.map(k => k.id === currentKelurahan.id ? { ...k, name: formData.name } : k));
      setIsEditModalOpen(false);
      setCurrentKelurahan(null);
      setFormData({ name: '' });
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!currentKelurahan) return;
    setIsLoading(true);
    setError(null);

    const { error } = await supabase
      .from('kelurahan')
      .delete()
      .eq('id', currentKelurahan.id);

    if (error) {
      setError(error.message);
    } else {
      setKelurahanList(kelurahanList.filter(k => k.id !== currentKelurahan.id));
      setIsDeleteModalOpen(false);
      setCurrentKelurahan(null);
      router.refresh();
    }
    setIsLoading(false);
  };

  const openEditModal = (kelurahan: Kelurahan) => {
    setCurrentKelurahan(kelurahan);
    setFormData({ name: kelurahan.name });
    setIsEditModalOpen(true);
    setError(null);
  };

  const openDeleteModal = (kelurahan: Kelurahan) => {
    setCurrentKelurahan(kelurahan);
    setIsDeleteModalOpen(true);
    setError(null);
  };

  const openAddModal = () => {
    setFormData({ name: '' });
    setIsAddModalOpen(true);
    setError(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Data Kelurahan</h2>
        <button 
          onClick={openAddModal}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Tambah Kelurahan
        </button>
      </div>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Manajemen data kelurahan di Kecamatan Ujungberung.</p>

      <div className="mt-8 overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-lg border shadow-sm dark:border-zinc-700">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th scope="col" className="w-16 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
                    No.
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
                    Nama Kelurahan
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                {kelurahanList.length === 0 ? (
                   <tr>
                     <td colSpan={3} className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                       Belum ada data kelurahan.
                     </td>
                   </tr>
                ) : (
                  kelurahanList.map((kelurahan, index) => (
                    <tr key={kelurahan.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {index + 1}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-300">
                        {kelurahan.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button 
                          onClick={() => openEditModal(kelurahan)}
                          className="text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <span className="mx-2 text-zinc-300 dark:text-zinc-600">|</span>
                        <button 
                          onClick={() => openDeleteModal(kelurahan)}
                          className="text-red-600 transition-colors hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Tambah Kelurahan</h3>
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nama Kelurahan</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  required
                />
              </div>
              {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Edit Kelurahan</h3>
            <form onSubmit={handleEdit}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nama Kelurahan</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  required
                />
              </div>
              {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Hapus Kelurahan</h3>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              Apakah Anda yakin ingin menghapus kelurahan <strong>{currentKelurahan?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
