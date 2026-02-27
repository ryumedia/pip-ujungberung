'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  keterangan: string | null;
  kelurahan?: { name: string } | null;
};

type Kelurahan = {
  id: number;
  name: string;
};

type RiwayatPengajuan = {
  id: number;
  created_at: string;
  tahun: string;
  status_pengajuan: string | null;
  deskripsi: string | null;
};

export default function PengajuanPage() {
  const [activeTab, setActiveTab] = useState<'pengajuan' | 'tambahData'>('pengajuan');
  
  // State for Search & Data
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [kelurahanList, setKelurahanList] = useState<Kelurahan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [riwayatPengajuan, setRiwayatPengajuan] = useState<RiwayatPengajuan[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userKelurahan, setUserKelurahan] = useState<string | null>(null);

  // State for Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // State for Ajukan
  const [isAjukanModalOpen, setIsAjukanModalOpen] = useState(false);
  const [tahunPengajuan, setTahunPengajuan] = useState(new Date().getFullYear().toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for Tambah Data Tab
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDataFormData, setNewDataFormData] = useState({
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
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
    fetchKelurahan();
    fetchUserRole();
  }, []);

  const fetchStudents = async () => {
    setIsLoadingData(true);
    let allStudents: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('students')
        .select('*, kelurahan:kelurahan_id (name)')
        .order('nama_siswa')
        .range(from, from + step - 1);

      if (error) {
        console.error("Error fetching students:", error);
        hasMore = false;
        break;
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

    const mappedStudents = allStudents.map((item: any) => ({
      ...item,
      kelurahan: Array.isArray(item.kelurahan) ? (item.kelurahan[0] || null) : item.kelurahan,
    }));

    setStudentList(mappedStudents);
    setIsLoadingData(false);
  };

  const fetchKelurahan = async () => {
    const { data } = await supabase.from('kelurahan').select('id, name').order('name');
    if (data) setKelurahanList(data);
  };

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, nama, kelurahan:kelurahan_id (name)')
        .eq('id', user.id)
        .single();
      if (profile) {
        setUserRole(profile.role);
        setUserName(profile.nama);
        // @ts-ignore
        setUserKelurahan(profile.kelurahan?.name);
      }
    }
  };

  const fetchRiwayatPengajuan = async (student: Student) => {
    const { data, error } = await supabase
      .from('pengajuan')
      .select('id, created_at, tahun, status_pengajuan, deskripsi')
      .eq('nama_siswa', student.nama_siswa)
      .eq('nama_ibu', student.nama_ibu)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching history:', error);
    } else {
      setRiwayatPengajuan(data || []);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(student.nama_siswa);
    setShowSuggestions(false);
    setIsEditing(false);
    setEditFormData(null);
    fetchRiwayatPengajuan(student);
  };

  const handleEditClick = () => {
    if (selectedStudent) {
      setEditFormData({ ...selectedStudent });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (editFormData) {
      const { name, value } = e.target;

      // Validasi: Kelas, RT, RW harus angka bulat dan tidak boleh diawali '0'
      if (['kelas', 'rt', 'rw'].includes(name)) {
        if (value !== '' && !/^[1-9][0-9]*$/.test(value)) {
          return;
        }
      }

      setEditFormData({ ...editFormData, [name]: value });
    }
  };

  const handleSaveStudent = async () => {
    if (!editFormData) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          nama_siswa: editFormData.nama_siswa,
          nama_sekolah: editFormData.nama_sekolah,
          kelas: editFormData.kelas,
          nama_ayah: editFormData.nama_ayah,
          nama_ibu: editFormData.nama_ibu,
          rt: editFormData.rt,
          rw: editFormData.rw,
          no_wa: editFormData.no_wa,
          kelurahan_id: editFormData.kelurahan_id,
          keterangan: editFormData.keterangan
        })
        .eq('id', editFormData.id);

      if (error) throw error;

      alert('Data siswa berhasil diperbarui.');
      
      // Update local state
      const updatedStudent = { ...editFormData };
      // Update kelurahan name in local object if kelurahan_id changed
      if (updatedStudent.kelurahan_id !== selectedStudent?.kelurahan_id) {
         const kel = kelurahanList.find(k => k.id == updatedStudent.kelurahan_id);
         updatedStudent.kelurahan = kel ? { name: kel.name } : null;
      } else {
         updatedStudent.kelurahan = selectedStudent?.kelurahan;
      }

      setSelectedStudent(updatedStudent);
      setStudentList(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan data: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAjukanClick = () => {
    setIsAjukanModalOpen(true);
  };

  const handleSubmitPengajuan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsSubmitting(true);

    try {
      // Check duplicate
      const { data: existingData, error: checkError } = await supabase
        .from('pengajuan')
        .select('id')
        .eq('nama_siswa', selectedStudent.nama_siswa)
        .eq('nama_ibu', selectedStudent.nama_ibu)
        .eq('tahun', tahunPengajuan);

      if (checkError) throw checkError;

      if (existingData && existingData.length > 0) {
        throw new Error(`Siswa ${selectedStudent.nama_siswa} sudah terdaftar di pengajuan tahun ${tahunPengajuan}.`);
      }

      const { error } = await supabase.from('pengajuan').insert({
        tahun: tahunPengajuan,
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
        keterangan: selectedStudent.keterangan || null
      });

      if (error) throw error;

      alert('Pengajuan berhasil dikirim!');
      setIsAjukanModalOpen(false);
      if (selectedStudent) {
        fetchRiwayatPengajuan(selectedStudent);
      }
    } catch (error: any) {
      alert('Gagal mengirim pengajuan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Validasi: Kelas, RT, RW harus angka bulat dan tidak boleh diawali '0'
    if (['kelas', 'rt', 'rw'].includes(name)) {
      if (value !== '' && !/^[1-9][0-9]*$/.test(value)) {
        return;
      }
    }

    const uppercaseFields = ['nama_siswa', 'nama_sekolah', 'nama_ayah', 'nama_ibu'];
    const finalValue = uppercaseFields.includes(name) ? value.toUpperCase() : value;

    setNewDataFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleAddNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingNew(true);

    try {
      if (!newDataFormData.kelurahan_id) {
        alert('Silakan pilih kelurahan');
        setIsAddingNew(false);
        return;
      }

      const { error } = await supabase.from('students').insert([{
        nama_siswa: newDataFormData.nama_siswa,
        nama_sekolah: newDataFormData.nama_sekolah,
        kelas: newDataFormData.kelas,
        nama_ayah: newDataFormData.nama_ayah,
        nama_ibu: newDataFormData.nama_ibu,
        rt: newDataFormData.rt,
        rw: newDataFormData.rw,
        kelurahan_id: parseInt(newDataFormData.kelurahan_id),
        no_wa: newDataFormData.no_wa,
        keterangan: newDataFormData.keterangan || null
      }]);

      if (error) throw error;

      alert('Data siswa berhasil ditambahkan!');
      setNewDataFormData({
        nama_siswa: '', nama_sekolah: '', kelas: '', nama_ayah: '', nama_ibu: '',
        rt: '', rw: '', kelurahan_id: '', no_wa: '', keterangan: ''
      });
      
      // Refresh student list so the new student appears in search
      fetchStudents();

    } catch (error: any) {
      alert('Gagal menyimpan data: ' + error.message);
    } finally {
      setIsAddingNew(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              PIP - Ujungberung
            </h1>
            {userName && (
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                {userName} - Koordinator Kelurahan {userKelurahan || '...'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {['super admin', 'admin kecamatan'].includes(userRole || '') && (
              <Link href="/admin/dashboard" className="rounded-full p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800" title="Panel Admin">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-zinc-600 dark:text-zinc-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex space-x-4 border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('pengajuan')}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'pengajuan'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Pengajuan
          </button>
          <button
            onClick={() => setActiveTab('tambahData')}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'tambahData'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Tambah Data
          </button>
        </div>

        {/* Tab Content */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-800">
          {activeTab === 'pengajuan' ? (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">Form Pengajuan</h2>
              <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                Cari data siswa untuk melihat detail, mengedit, atau mengajukan PIP.
              </p>
              
              {/* Search Box */}
              <div className="relative mb-8">
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Cari Siswa - Pastikan Sesuai KK</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!isEditing) setSelectedStudent(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Ketik nama siswa..."
                  className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"
                />
                {showSuggestions && searchQuery && !selectedStudent && (
                  <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                    {studentList.filter(s => s.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                      studentList.filter(s => s.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                        <li
                          key={s.id}
                          onClick={() => handleSelectStudent(s)}
                          className="cursor-pointer px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">{s.nama_siswa}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{s.nama_sekolah} - {s.kelas}</div>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {isLoadingData ? 'Memuat data...' : 'Siswa tidak ditemukan, Silakan Input Tambah Data Siswa'}
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Student Details */}
              {selectedStudent && (
                <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Detail Siswa</h3>
                    {isEditing && (
                        <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Mode Edit</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Helper to render fields */}
                    {[
                        { label: 'Nama Siswa', name: 'nama_siswa' },
                        { label: 'Nama Sekolah', name: 'nama_sekolah' },
                        { label: 'Kelas', name: 'kelas' },
                        { label: 'Nama Ayah', name: 'nama_ayah' },
                        { label: 'Nama Ibu', name: 'nama_ibu' },
                        { label: 'RT', name: 'rt' },
                        { label: 'RW', name: 'rw' },
                        { label: 'No. WA', name: 'no_wa' },
                        { label: 'Kelurahan', name: 'kelurahan_id', type: 'select' },
                        { label: 'Keterangan', name: 'keterangan', type: 'textarea' },
                    ].map((field) => (
                        <div key={field.name}>
                            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{field.label}</label>
                            {isEditing && editFormData ? (
                                field.type === 'select' ? (
                                    <select 
                                        name={field.name} 
                                        value={editFormData[field.name as keyof Student] as string | number} 
                                        onChange={handleInputChange} 
                                        className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"
                                    >
                                        <option value="">-- Pilih Kelurahan --</option>
                                        {kelurahanList.map(k => (
                                            <option key={k.id} value={k.id}>{k.name}</option>
                                        ))}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea 
                                        name={field.name} 
                                        value={editFormData[field.name as keyof Student] as string || ''} 
                                        onChange={handleInputChange} 
                                        className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"
                                    />
                                ) : (
                                    <input 
                                        type="text" 
                                        name={field.name} 
                                        value={editFormData[field.name as keyof Student] as string || ''} 
                                        onChange={handleInputChange} 
                                        className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"
                                    />
                                )
                            ) : (
                                <div className="p-2 text-zinc-900 dark:text-zinc-100 font-medium border-b border-zinc-100 dark:border-zinc-700">
                                    {field.name === 'kelurahan_id' ? selectedStudent.kelurahan?.name : (selectedStudent[field.name as keyof Student] as string || '-')}
                                </div>
                            )}
                        </div>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-3">
                    {isEditing ? (
                        <>
                            <button onClick={handleSaveStudent} disabled={isSaving} className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50">
                                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                            <button onClick={handleCancelEdit} className="rounded-md bg-zinc-200 px-4 py-2 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200">
                                Batal
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleEditClick} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Edit Data</button>
                            <button onClick={handleAjukanClick} className="rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">Ajukan PIP</button>
                        </>
                    )}
                  </div>

                  {/* Riwayat Pengajuan Section */}
                  <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-700">
                    <h3 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">Riwayat Pengajuan</h3>
                    {riwayatPengajuan.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap text-left text-sm">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-700">
                              <th className="pb-2 font-semibold text-zinc-900 dark:text-zinc-100">Tahun</th>
                              <th className="pb-2 font-semibold text-zinc-900 dark:text-zinc-100">Status</th>
                              <th className="pb-2 font-semibold text-zinc-900 dark:text-zinc-100">Deskripsi</th>
                              <th className="pb-2 font-semibold text-zinc-900 dark:text-zinc-100">Tanggal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {riwayatPengajuan.map((item) => (
                              <tr key={item.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                                <td className="py-2 text-zinc-600 dark:text-zinc-400">{item.tahun}</td>
                                <td className="py-2">
                                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                                    item.status_pengajuan === 'Sudah SK' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    item.status_pengajuan === 'Tidak Terdaftar' || item.status_pengajuan === 'Tidak Diajukan' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    item.status_pengajuan === 'Diinput' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                    item.status_pengajuan === 'Diajukan Lain' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  }`}>
                                    {item.status_pengajuan || 'Menunggu'}
                                  </span>
                                </td>
                                <td className="py-2 text-zinc-600 dark:text-zinc-400">{item.deskripsi || '-'}</td>
                                <td className="py-2 text-zinc-600 dark:text-zinc-400">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-zinc-500 dark:text-zinc-400">Belum ada riwayat pengajuan.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">Tambah Data Siswa</h2>
              <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                Isi formulir di bawah ini untuk menambahkan data siswa baru ke dalam sistem.
              </p>
              <form onSubmit={handleAddNewStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Siswa</label>
                    <input type="text" name="nama_siswa" value={newDataFormData.nama_siswa} onChange={handleNewDataChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Sekolah</label>
                    <input type="text" name="nama_sekolah" value={newDataFormData.nama_sekolah} onChange={handleNewDataChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kelas</label>
                    <input type="text" name="kelas" value={newDataFormData.kelas} onChange={handleNewDataChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">No. WA</label>
                    <input type="text" name="no_wa" value={newDataFormData.no_wa} onChange={handleNewDataChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Ayah</label>
                    <input type="text" name="nama_ayah" value={newDataFormData.nama_ayah} onChange={handleNewDataChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Ibu</label>
                    <input type="text" name="nama_ibu" value={newDataFormData.nama_ibu} onChange={handleNewDataChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">RT</label>
                      <input type="text" name="rt" value={newDataFormData.rt} onChange={handleNewDataChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">RW</label>
                      <input type="text" name="rw" value={newDataFormData.rw} onChange={handleNewDataChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kelurahan</label>
                    <select name="kelurahan_id" value={newDataFormData.kelurahan_id} onChange={handleNewDataChange} required className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700">
                      <option value="">-- Pilih Kelurahan --</option>
                      {kelurahanList.map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Keterangan (Opsional)</label>
                  <textarea name="keterangan" value={newDataFormData.keterangan} onChange={handleNewDataChange} rows={3} className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"></textarea>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button type="submit" disabled={isAddingNew} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                    {isAddingNew ? 'Menyimpan...' : 'Simpan Data'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajukan */}
      {isAjukanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Ajukan PIP</h3>
              <button onClick={() => setIsAjukanModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPengajuan} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tahun Pengajuan</label>
                <input
                  type="number"
                  value={tahunPengajuan}
                  onChange={(e) => setTahunPengajuan(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsAjukanModalOpen(false)} className="rounded-md bg-zinc-200 px-4 py-2 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}