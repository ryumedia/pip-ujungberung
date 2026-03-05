'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import * as XLSX from 'xlsx';

type School = {
  id: number;
  nama_sekolah: string;
};

export default function DataSekolahPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [namaSekolah, setNamaSekolah] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const supabase = createClient();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setIsLoading(true);
    try {
      let allSchools: School[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while(hasMore) {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .order('nama_sekolah', { ascending: true })
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allSchools = [...allSchools, ...data];
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }
      setSchools(allSchools);
    } catch (error: any) {
      alert('Gagal memuat data sekolah: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('schools')
          .update({ nama_sekolah: namaSekolah })
          .eq('id', editingId);
        if (error) throw error;
        alert('Data sekolah berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('schools')
          .insert([{ nama_sekolah: namaSekolah }]);
        if (error) throw error;
        alert('Data sekolah berhasil ditambahkan');
      }

      setIsModalOpen(false);
      setNamaSekolah('');
      setEditingId(null);
      fetchSchools();
    } catch (error: any) {
      alert('Gagal menyimpan data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (school: School) => {
    setEditingId(school.id);
    setNamaSekolah(school.nama_sekolah);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sekolah ini?')) return;

    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert('Data sekolah berhasil dihapus');
      fetchSchools();
    } catch (error: any) {
      alert('Gagal menghapus data: ' + error.message);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setNamaSekolah('');
    setIsModalOpen(true);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('File Excel kosong.');
        setIsImporting(false);
        return;
      }

      const schoolsToInsert = jsonData.map((row: any) => {
        const key = Object.keys(row).find(k => k.trim().toLowerCase() === 'nama sekolah');
        if (!key || !row[key]) {
          return null;
        }
        return {
          nama_sekolah: String(row[key]).trim(),
        };
      }).filter((school): school is { nama_sekolah: string } => school !== null && school.nama_sekolah !== '');

      if (schoolsToInsert.length === 0) {
        alert('Tidak ada data sekolah yang valid ditemukan. Pastikan file Excel Anda memiliki kolom "nama sekolah" dengan data di dalamnya.');
        setIsImporting(false);
        return;
      }

      // Proses unggah data dalam batch untuk menangani lebih dari 1000 baris
      const chunkSize = 500;
      for (let i = 0; i < schoolsToInsert.length; i += chunkSize) {
        const chunk = schoolsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('schools').insert(chunk);
        if (error) {
          if (error.code === '23505') { // Kode error untuk pelanggaran unique constraint
            throw new Error(`Gagal mengimpor data karena ada nama sekolah yang duplikat. Silakan periksa kembali file Anda. Detail: ${error.details}`);
          }
          throw error;
        }
      }

      alert(`Berhasil mengimpor ${schoolsToInsert.length} data sekolah.`);
      fetchSchools();
    } catch (error: any) {
      console.error('Import error:', error);
      alert('Gagal mengimpor file: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(schools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = schools.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Data Sekolah</h2>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Daftar nama sekolah yang terdaftar.</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
          <button onClick={handleImportClick} disabled={isImporting} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
            {isImporting ? 'Mengimport...' : 'Import Excel'}
          </button>
          <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Tambah Sekolah
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-zinc-500">Memuat data...</div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100 w-16">No</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Sekolah</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {schools.length > 0 ? (
                currentData.map((school, index) => (
                  <tr key={school.id} className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{school.nama_sekolah}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(school)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(school.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-zinc-600 dark:text-zinc-400">
                    Belum ada data sekolah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && schools.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Menampilkan {startIndex + 1} sampai {Math.min(endIndex, schools.length)} dari {schools.length} data
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md bg-zinc-200 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            >
              Sebelumnya
            </button>
            <span className="flex items-center px-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-md bg-zinc-200 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {editingId ? 'Edit Sekolah' : 'Tambah Sekolah'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Sekolah</label>
                <input
                  type="text"
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"
                  placeholder="Masukkan nama sekolah"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-200 text-zinc-800 rounded-md hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
