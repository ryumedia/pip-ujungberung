'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

type PengajuanWithKelurahan = {
  id: number;
  created_at: string;
  tahun: string;
  nama_siswa: string;
  nama_sekolah: string;
  kelas: string;
  nama_ayah: string;
  nama_ibu: string;
  rt: string;
  rw: string;
  no_wa: string;
  status_pengajuan: string | null;
  keterangan: string | null;
  kelurahan: { name: string } | null;
};

type Student = {
  id: number;
  nama_siswa: string;
  nama_sekolah: string;
  kelas: string;
  nama_ayah: string;
  nama_ibu: string;
  rt: string;
  rw: string;
  no_wa: string;
  kelurahan_id: number;
};

export default function AdminPengajuanPage() {
  const [pengajuanList, setPengajuanList] = useState<PengajuanWithKelurahan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
    fetchStudents();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pengajuan')
        .select(`
          *,
          kelurahan:kelurahan_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapping data untuk menangani format array/object dari join
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        kelurahan: Array.isArray(item.kelurahan) ? (item.kelurahan[0] || null) : item.kelurahan,
      }));

      setPengajuanList(mappedData);
    } catch (error: any) {
      console.error('Error fetching pengajuan:', error.message);
      alert('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    let allStudents: Student[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('nama_siswa')
        .range(from, from + step - 1);

      if (error) {
        console.error("Error fetching students for search:", error);
        alert('Gagal memuat semua data siswa untuk pencarian.');
        hasMore = false; // stop on error
        return;
      }

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
    setStudentList(allStudents);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('pengajuan')
        .update({ status_pengajuan: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update state lokal agar UI berubah instan
      setPengajuanList(prev => prev.map(item => 
        item.id === id ? { ...item, status_pengajuan: newStatus } : item
      ));
      
    } catch (error: any) {
      alert('Gagal mengubah status: ' + error.message);
      fetchData(); // Refresh data jika gagal
    }
  };

  const updateKeteranganLocal = (id: number, val: string) => {
    setPengajuanList(prev => prev.map(item =>
      item.id === id ? { ...item, keterangan: val } : item
    ));
  };

  const saveKeterangan = async (id: number, val: string) => {
    try {
      const { error } = await supabase
        .from('pengajuan')
        .update({ keterangan: val })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error saving keterangan:', error);
      alert('Gagal menyimpan keterangan: ' + error.message);
    }
  };

  const handleSubmitPengajuan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Silakan pilih siswa dari daftar pencarian.');
      return;
    }
    setIsSubmitting(true);

    try {
      // Cek apakah data sudah ada sebelumnya untuk mencegah duplikasi
      // Kita menggunakan kombinasi Nama Siswa, Nama Ibu, dan Tahun sebagai penanda unik
      const { data: existingData } = await supabase
        .from('pengajuan')
        .select('id')
        .eq('nama_siswa', selectedStudent.nama_siswa)
        .eq('nama_ibu', selectedStudent.nama_ibu)
        .eq('tahun', tahun);

      if (existingData && existingData.length > 0) {
        throw new Error(`Siswa ${selectedStudent.nama_siswa} sudah terdaftar di pengajuan tahun ${tahun}.`);
      }

      const { error } = await supabase.from('pengajuan').insert({
        tahun: tahun,
        nama_siswa: selectedStudent.nama_siswa,
        nama_sekolah: selectedStudent.nama_sekolah,
        kelas: selectedStudent.kelas,
        nama_ayah: selectedStudent.nama_ayah,
        nama_ibu: selectedStudent.nama_ibu,
        rt: selectedStudent.rt,
        rw: selectedStudent.rw,
        kelurahan_id: selectedStudent.kelurahan_id,
        no_wa: selectedStudent.no_wa,
        status_pengajuan: 'Menunggu',
        keterangan: ''
      });

      if (error) throw error;

      alert('Pengajuan berhasil ditambahkan!');
      setIsModalOpen(false);
      setSearchQuery('');
      setSelectedStudent(null);
      fetchData();
    } catch (error: any) {
      alert('Gagal menyimpan pengajuan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Data Pengajuan</h2>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Daftar pengajuan yang masuk untuk diverifikasi.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Tambah Pengajuan
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-zinc-500">Memuat data pengajuan...</div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tanggal</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tahun</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Siswa</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sekolah / Kelas</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Orang Tua</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Alamat</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">No. WA</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {pengajuanList.length > 0 ? (
                pengajuanList.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{item.tahun}</td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.nama_siswa}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{item.nama_sekolah} <br/> <span className="text-xs opacity-75">Kelas: {item.kelas}</span></td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">Ayah: {item.nama_ayah} <br/> Ibu: {item.nama_ibu}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {item.kelurahan?.name || '-'} <br/> 
                      <span className="text-xs">RT {item.rt} / RW {item.rw}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{item.no_wa}</td>
                    <td className="px-6 py-4 text-sm">
                      <select 
                        value={item.status_pengajuan || 'Menunggu'} 
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className={`rounded-md border px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-800 
                          ${item.status_pengajuan === 'Sudah SK' ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                            item.status_pengajuan === 'Tidak Terdaftar' || item.status_pengajuan === 'Tidak Diajukan' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                            item.status_pengajuan === 'Diinput' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            item.status_pengajuan === 'Diajukan Lain' ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                            'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}
                      >
                        <option value="Menunggu">Menunggu</option>
                        <option value="Diinput">Diinput</option>
                        <option value="Sudah SK">Sudah SK</option>
                        <option value="Diajukan Lain">Diajukan Lain</option>
                        <option value="Tidak Terdaftar">Tidak Terdaftar</option>
                        <option value="Tidak Diajukan">Tidak Diajukan</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <input
                        type="text"
                        value={item.keterangan || ''}
                        onChange={(e) => updateKeteranganLocal(item.id, e.target.value)}
                        onBlur={(e) => saveKeterangan(item.id, e.target.value)}
                        placeholder="-"
                        className="w-full min-w-[150px] rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-zinc-600 dark:text-zinc-400">
                    Belum ada data pengajuan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tambah Pengajuan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Tambah Pengajuan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPengajuan} className="space-y-4">
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Cari Siswa</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedStudent(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Ketik nama siswa..."
                  className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"
                  required
                />
                {showSuggestions && searchQuery && !selectedStudent && (
                  <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                    {studentList.filter(s => s.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                      studentList.filter(s => s.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                        <li
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setSearchQuery(s.nama_siswa);
                            setShowSuggestions(false);
                          }}
                          className="cursor-pointer px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{s.nama_siswa}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{s.nama_sekolah} - {s.kelas}</div>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">Siswa tidak ditemukan</li>
                    )}
                  </ul>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tahun Pengajuan</label>
                <input
                  type="number"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md bg-zinc-200 px-4 py-2 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Menyimpan...' : 'Kirim Pengajuan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}