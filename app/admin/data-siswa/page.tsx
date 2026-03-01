'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
// import * as XLSX from 'xlsx';

type StudentWithKelurahan = {
  id: number;
  nama_siswa: string;
  nama_sekolah: string;
  kelas: string;
  nama_ayah: string;
  nama_ibu: string;
  rt: string;
  rw: string;
  no_wa: string;
  keterangan: string | null;
  kelurahan_id: number;
  kelurahan: { name: string } | null;
};

type Kelurahan = {
  id: number;
  name: string;
};

export default function DataSiswaPage() {
  const [students, setStudents] = useState<StudentWithKelurahan[]>([]);
  const [kelurahanList, setKelurahanList] = useState<Kelurahan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State untuk Filter
  const [filterNama, setFilterNama] = useState('');
  const [filterNamaAyah, setFilterNamaAyah] = useState('');
  const [filterNamaIbu, setFilterNamaIbu] = useState('');
  const [filterRT, setFilterRT] = useState('');
  const [filterRW, setFilterRW] = useState('');
  const [filterKelurahan, setFilterKelurahan] = useState('');

  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  
  // State untuk Modal dan Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nama_siswa: '',
    nama_sekolah: '',
    kelas: '',
    nama_ayah: '',
    nama_ibu: '',
    rt: '',
    rw: '',
    kelurahan_id: '',
    no_wa: '',
    keterangan: ''
  });

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Data Siswa
      let allStudents: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('students')
          .select(`
            *,
            kelurahan:kelurahan_id (name)
          `)
          .order('created_at', { ascending: false })
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allStudents = [...allStudents, ...data];
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }

      // Fetch Data Kelurahan untuk Dropdown
      const { data: kelurahanData, error: kelurahanError } = await supabase
        .from('kelurahan')
        .select('id, name')
        .order('name');

      if (kelurahanError) throw kelurahanError;

      // Mapping data siswa untuk menangani format array/object dari join
      const mappedStudents = allStudents.map((item: any) => ({
        ...item,
        kelurahan: Array.isArray(item.kelurahan) ? (item.kelurahan[0] || null) : item.kelurahan,
      }));

      setStudents(mappedStudents);
      setKelurahanList(kelurahanData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
      alert('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      nama_siswa: '', nama_sekolah: '', kelas: '', nama_ayah: '', nama_ibu: '',
      rt: '', rw: '', kelurahan_id: '', no_wa: '', keterangan: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: StudentWithKelurahan) => {
    setEditingId(student.id);
    setFormData({
      nama_siswa: student.nama_siswa,
      nama_sekolah: student.nama_sekolah,
      kelas: student.kelas,
      nama_ayah: student.nama_ayah,
      nama_ibu: student.nama_ibu,
      rt: student.rt,
      rw: student.rw,
      kelurahan_id: student.kelurahan_id.toString(),
      no_wa: student.no_wa,
      keterangan: student.keterangan || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.kelurahan_id) {
        alert('Silakan pilih kelurahan');
        setIsSubmitting(false);
        return;
      }

      // Cek duplikasi data berdasarkan nama_siswa dan nama_ibu
      const { data: existingData, error: checkError } = await supabase
        .from('students')
        .select('id')
        .eq('nama_siswa', formData.nama_siswa)
        .eq('nama_ibu', formData.nama_ibu);

      if (checkError) throw checkError;

      if (existingData && existingData.length > 0) {
        // Jika sedang edit, pastikan data yang ditemukan bukan data yang sedang diedit
        const isDuplicate = editingId
          ? existingData.some((item) => item.id !== editingId)
          : true;

        if (isDuplicate) {
          alert(`Data siswa dengan nama "${formData.nama_siswa}" dan nama ibu "${formData.nama_ibu}" sudah ada.`);
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        nama_siswa: formData.nama_siswa,
        nama_sekolah: formData.nama_sekolah,
        kelas: formData.kelas,
        nama_ayah: formData.nama_ayah,
        nama_ibu: formData.nama_ibu,
        rt: formData.rt,
        rw: formData.rw,
        kelurahan_id: parseInt(formData.kelurahan_id),
        no_wa: formData.no_wa,
        keterangan: formData.keterangan || null
      };

      let error;

      if (editingId) {
        // Mode Edit
        const { error: updateError } = await supabase
          .from('students')
          .update(payload)
          .eq('id', editingId);
        error = updateError;
      } else {
        // Mode Tambah
        const { error: insertError } = await supabase
          .from('students')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      alert(`Data siswa berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}!`);
      setIsModalOpen(false);
      setEditingId(null);
      fetchData(); // Refresh tabel

    } catch (error: any) {
      alert('Gagal menyimpan data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Data siswa berhasil dihapus');
      fetchData();
    } catch (error: any) {
      alert('Gagal menghapus data: ' + error.message);
    }
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
      alert('Fungsi import Excel dinonaktifkan sementara untuk perbaikan server.');
      // Vercel build fix: The following code uses xlsx which is not compatible with Edge Runtime.
      // This functionality needs to be moved to a Serverless Function (API Route).
      /*
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('File Excel kosong.');
        return;
      }

      const kelurahanMap = new Map();
      kelurahanList.forEach(k => {
        kelurahanMap.set(k.name.toLowerCase().trim(), k.id);
      });

      const studentsToInsert = [];
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        const rowNum = i + 2; // Baris Excel (header baris 1)

        const getValue = (key: string) => {
          const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
          return foundKey ? row[foundKey] : undefined;
        };

        const kelurahanName = getValue('kelurahan');
        
        if (!kelurahanName) {
          errors.push(`Baris ${rowNum}: Nama Kelurahan kosong.`);
          continue;
        }

        const kelurahanId = kelurahanMap.get(String(kelurahanName).toLowerCase().trim());

        if (!kelurahanId) {
          errors.push(`Baris ${rowNum}: Kelurahan '${kelurahanName}' tidak ditemukan di sistem.`);
          continue;
        }

        const namaSiswa = getValue('nama siswa');
        if (!namaSiswa) {
           errors.push(`Baris ${rowNum}: Nama Siswa kosong.`);
           continue;
        }

        studentsToInsert.push({
          nama_siswa: namaSiswa,
          nama_sekolah: getValue('nama sekolah') || '',
          kelas: getValue('kelas') || '',
          nama_ayah: getValue('nama ayah') || '',
          nama_ibu: getValue('nama ibu') || '',
          rt: String(getValue('rt') || ''),
          rw: String(getValue('rw') || ''),
          kelurahan_id: kelurahanId,
          no_wa: String(getValue('no. wa') || getValue('no wa') || ''),
          keterangan: getValue('keterangan') || null,
        });
      }

      if (errors.length > 0) {
        alert(`Ditemukan beberapa kesalahan:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...dan lainnya.' : ''}\n\nData yang valid akan tetap diimport.`);
        if (studentsToInsert.length === 0) return;
      }

      if (studentsToInsert.length > 0) {
        const { error } = await supabase.from('students').insert(studentsToInsert);
        if (error) throw error;
        alert(`Berhasil mengimport ${studentsToInsert.length} data siswa.`);
        fetchData();
      }
      */
    } catch (error: any) {
      console.error('Import error:', error);
      alert('Gagal mengimport file: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchNama = filterNama ? student.nama_siswa.toLowerCase().includes(filterNama.toLowerCase()) : true;
    const matchNamaAyah = filterNamaAyah ? student.nama_ayah.toLowerCase().includes(filterNamaAyah.toLowerCase()) : true;
    const matchNamaIbu = filterNamaIbu ? student.nama_ibu.toLowerCase().includes(filterNamaIbu.toLowerCase()) : true;
    const matchRT = filterRT ? student.rt === filterRT : true;
    const matchRW = filterRW ? student.rw === filterRW : true;
    const matchKelurahan = filterKelurahan ? student.kelurahan_id.toString() === filterKelurahan : true;
    return matchNama && matchNamaAyah && matchNamaIbu && matchRT && matchRW && matchKelurahan;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset halaman ke 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterNama, filterNamaAyah, filterNamaIbu, filterRT, filterRW, filterKelurahan]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Data Siswa
          </h2>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Daftar lengkap siswa penerima dan calon penerima beasiswa.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isImporting ? 'Mengimport...' : 'Import Excel'}
          </button>
          <button 
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <input
          type="text"
          placeholder="Cari Nama Siswa..."
          value={filterNama}
          onChange={(e) => setFilterNama(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
        <input
          type="text"
          placeholder="Cari Nama Ayah..."
          value={filterNamaAyah}
          onChange={(e) => setFilterNamaAyah(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
        <input
          type="text"
          placeholder="Cari Nama Ibu..."
          value={filterNamaIbu}
          onChange={(e) => setFilterNamaIbu(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
        <select
          value={filterKelurahan}
          onChange={(e) => setFilterKelurahan(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        >
          <option value="">-- Semua Kelurahan --</option>
          {kelurahanList.map((k) => (
            <option key={k.id} value={k.id.toString()}>
              {k.name}
            </option>
          ))}
        </select>
        <select
          value={filterRT}
          onChange={(e) => setFilterRT(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        >
          <option value="">-- Semua RT --</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num.toString()}>{num}</option>
          ))}
        </select>
        <select
          value={filterRW}
          onChange={(e) => setFilterRW(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        >
          <option value="">-- Semua RW --</option>
          {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num.toString()}>{num}</option>
          ))}
        </select>
      </div>

      {/* Modal Tambah Siswa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{editingId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Siswa</label>
                  <input type="text" name="nama_siswa" value={formData.nama_siswa} onChange={handleInputChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Sekolah</label>
                  <input type="text" name="nama_sekolah" value={formData.nama_sekolah} onChange={handleInputChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kelas</label>
                  <input type="text" name="kelas" value={formData.kelas} onChange={handleInputChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">No. WA</label>
                  <input type="text" name="no_wa" value={formData.no_wa} onChange={handleInputChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Ayah</label>
                  <input type="text" name="nama_ayah" value={formData.nama_ayah} onChange={handleInputChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Ibu</label>
                  <input type="text" name="nama_ibu" value={formData.nama_ibu} onChange={handleInputChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">RT</label>
                    <input type="text" name="rt" value={formData.rt} onChange={handleInputChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">RW</label>
                    <input type="text" name="rw" value={formData.rw} onChange={handleInputChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kelurahan</label>
                  <select name="kelurahan_id" value={formData.kelurahan_id} onChange={handleInputChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700">
                    <option value="">-- Pilih Kelurahan --</option>
                    {kelurahanList.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Keterangan (Opsional)</label>
                <textarea name="keterangan" value={formData.keterangan} onChange={handleInputChange} rows={3} className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"></textarea>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-200 text-zinc-800 rounded-md hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Simpan Data')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-zinc-500">Memuat data...</div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Siswa</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Sekolah</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kelas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Ayah</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Ibu</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">RT</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">RW</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kelurahan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">No. WA</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Keterangan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Aksi</th>
              </tr>
            </thead>
            <tbody>
                {currentData.length > 0 ? (
                  currentData.map((student) => (
                    <tr key={student.id} className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {student.nama_siswa}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{student.nama_sekolah}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{student.kelas}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{student.nama_ayah}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{student.nama_ibu}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{student.rt}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{student.rw}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {student.kelurahan?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{student.no_wa}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{student.keterangan || "-"}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-3">
                          <button 
                            onClick={() => openEditModal(student)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
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
                    <td colSpan={11} className="px-6 py-8 text-center text-zinc-600 dark:text-zinc-400">
                      Belum ada data siswa.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && filteredStudents.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Menampilkan {startIndex + 1} sampai {Math.min(endIndex, filteredStudents.length)} dari {filteredStudents.length} data
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
    </div>
  );
}