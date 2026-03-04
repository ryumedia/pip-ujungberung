'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import * as XLSX from 'xlsx';

type Pencairan = {
  id: number;
  created_at: string;
  tahun: string | null;
  nama_siswa: string | null;
  nisn: string | null;
  kelas: string | null;
  nama_sekolah: string | null;
  nama_ibu: string | null;
  virtual_account: string | null;
  nomer_rekening: string | null;
  tahap: string | null;
  nominal: number | null;
  tipe_sk: string | null;
  nomor_sk: string | null;
  nik: string | null;
  nama_pengusul: string | null;
  nama_ayah: string | null;
  tanggal_sk: string | null;
  rt: string | null;
  rw: string | null;
  kelurahan_id: number | null;
  kelurahan: { name: string } | null;
};

type Kelurahan = {
  id: number;
  name: string;
};

export default function PencairanPage() {
  const [pencairanList, setPencairanList] = useState<Pencairan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPencairan, setSelectedPencairan] = useState<Pencairan | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterSekolah, setFilterSekolah] = useState('');
  const [filterTipeSk, setFilterTipeSk] = useState('');
  const [filterRt, setFilterRt] = useState('');
  const [filterRw, setFilterRw] = useState('');
  const [filterKelurahan, setFilterKelurahan] = useState('');
  const [kelurahanList, setKelurahanList] = useState<Kelurahan[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const supabase = createClient();

  useEffect(() => {
    fetchData();
    fetchKelurahanList();
  }, []);

  const fetchKelurahanList = async () => {
    const { data, error } = await supabase
      .from('kelurahan')
      .select('id, name')
      .order('name');
    if (error) {
      console.error('Error fetching kelurahan list:', error);
    } else {
      setKelurahanList(data || []);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('pencairan')
          .select(`
            *,
            kelurahan:kelurahan_id (name)
          `)
          .order('created_at', { ascending: false })
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }

      // Mapping data untuk menangani format array/object dari join
      const mappedData = allData.map((item: any) => ({
        ...item,
        kelurahan: Array.isArray(item.kelurahan) ? (item.kelurahan[0] || null) : item.kelurahan,
      }));
      setPencairanList(mappedData);
    } catch (error: any) {
      console.error('Error fetching pencairan data:', error.message);
      alert('Gagal memuat data pencairan: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Logic
  const uniqueYears = Array.from(new Set(pencairanList.map(item => item.tahun).filter(Boolean))).sort().reverse();
  const uniqueTipeSk = Array.from(new Set(pencairanList.map(item => item.tipe_sk).filter(Boolean))).sort();

  const filteredData = pencairanList.filter((item) => {
    const matchNama = searchQuery
      ? item.nama_siswa?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchTahun = filterTahun ? item.tahun === filterTahun : true;
    const matchSekolah = filterSekolah
      ? item.nama_sekolah?.toLowerCase().includes(filterSekolah.toLowerCase())
      : true;
    const matchTipeSk = filterTipeSk ? item.tipe_sk === filterTipeSk : true;
    const matchRt = filterRt ? item.rt === filterRt : true;
    const matchRw = filterRw ? item.rw === filterRw : true;
    const matchKelurahan = filterKelurahan ? item.kelurahan_id?.toString() === filterKelurahan : true;

    return matchNama && matchTahun && matchSekolah && matchTipeSk && matchRt && matchRw && matchKelurahan;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterTahun, filterSekolah, filterTipeSk, filterRt, filterRw, filterKelurahan]);

  const handleExport = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data yang cocok dengan filter untuk diekspor.');
      return;
    }

    setIsExporting(true);
    try {
      // Menggunakan data yang sudah difilter di client-side
      const dataToExport = filteredData.map(({ id, created_at, ...rest }) => rest);

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pencairan");
      XLSX.writeFile(workbook, "Data_Pencairan_PIP.xlsx");

    } catch (error: any) {
      console.error('Export error:', error);
      alert('Gagal mengekspor data: ' + error.message);
    } finally {
      setIsExporting(false);
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('File Excel kosong.');
        return;
      }

      const dataToInsert = jsonData.map((row: any) => {
        const getVal = (key: string) => {
          const foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase());
          return foundKey ? row[foundKey] : null;
        };

        return {
          tahun: getVal('tahun') ? String(getVal('tahun')) : null,
          nama_siswa: getVal('nama siswa'),
          nisn: getVal('nisn') ? String(getVal('nisn')) : null,
          kelas: getVal('kelas') ? String(getVal('kelas')) : null,
          nama_sekolah: getVal('nama sekolah'),
          nama_ibu: getVal('nama ibu'),
          virtual_account: getVal('virtual account') ? String(getVal('virtual account')) : null,
          nomer_rekening: getVal('nomer rekening') || getVal('no rekening') ? String(getVal('nomer rekening') || getVal('no rekening')) : null,
          tahap: getVal('tahap') ? String(getVal('tahap')) : null,
          nominal: getVal('nominal'),
          tipe_sk: getVal('tipe sk'),
          nomor_sk: getVal('nomor sk'),
          nik: getVal('nik') ? String(getVal('nik')) : null,
          nama_pengusul: getVal('nama pengusul'),
          nama_ayah: getVal('nama ayah'),
          tanggal_sk: getVal('tanggal sk'),
        };
      });

      const chunkSize = 100;
      for (let i = 0; i < dataToInsert.length; i += chunkSize) {
        const chunk = dataToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('pencairan').insert(chunk);
        if (error) throw error;
      }

      alert(`Berhasil mengimport ${dataToInsert.length} data.`);
      fetchData();
    } catch (error: any) {
      console.error('Import error:', error);
      alert('Gagal mengimport file: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSync = async () => {
    if (!confirm('Apakah Anda yakin ingin melakukan sinkronisasi data? Proses ini akan mengisi kolom RT, RW, dan Kelurahan di tabel Pencairan berdasarkan kecocokan Nama Siswa dengan Data Siswa.')) return;

    setIsSyncing(true);
    try {
      // 1. Ambil data referensi dari tabel students
      let allStudents: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('students')
          .select('nama_siswa, rt, rw, kelurahan_id')
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allStudents = [...allStudents, ...data];
          if (data.length < step) hasMore = false;
          else from += step;
        } else {
          hasMore = false;
        }
      }

      // Buat Map untuk pencarian cepat: nama_siswa (lowercase) -> data student
      const studentMap = new Map();
      allStudents.forEach(s => {
        if (s.nama_siswa) {
          studentMap.set(s.nama_siswa.toLowerCase().trim(), s);
        }
      });

      // 2. Ambil semua data pencairan yang perlu diupdate
      let allPencairan: any[] = [];
      from = 0;
      hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('pencairan')
          .select('id, nama_siswa')
          .range(from, from + step - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          allPencairan = [...allPencairan, ...data];
          if (data.length < step) hasMore = false;
          else from += step;
        } else {
          hasMore = false;
        }
      }

      // 3. Lakukan pencocokan dan update
      let updatedCount = 0;
      const updates = [];

      for (const p of allPencairan) {
        if (!p.nama_siswa) continue;
        const match = studentMap.get(p.nama_siswa.toLowerCase().trim());
        if (match) {
          updates.push({
            id: p.id,
            rt: match.rt,
            rw: match.rw,
            kelurahan_id: match.kelurahan_id
          });
        }
      }

      if (updates.length === 0) {
        alert('Tidak ada data yang cocok untuk disinkronisasi.');
        setIsSyncing(false);
        return;
      }

      // 4. Eksekusi Update (Batching)
      const batchSize = 20;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        await Promise.all(batch.map(u => 
          supabase
            .from('pencairan')
            .update({
              rt: u.rt,
              rw: u.rw,
              kelurahan_id: u.kelurahan_id
            })
            .eq('id', u.id)
        ));
        updatedCount += batch.length;
      }

      alert(`Sinkronisasi berhasil! ${updatedCount} data telah diperbarui.`);
      fetchData();

    } catch (error: any) {
      console.error('Sync error:', error);
      alert('Gagal melakukan sinkronisasi: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Status Pencairan</h2>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">Monitoring status pencairan dana beasiswa.</p>
        </div>
        <div className="flex gap-3">
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
            <button onClick={handleImportClick} disabled={isImporting} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                {isImporting ? 'Mengimport...' : 'Import Excel'}
            </button>
            <button onClick={handleSync} disabled={isSyncing} className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Data'}
            </button>
            <button onClick={handleExport} disabled={isExporting} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                {isExporting ? 'Mengekspor...' : 'Download Excel'}
            </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <input
          type="text"
          placeholder="Cari Nama Siswa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
        <select
          value={filterTahun}
          onChange={(e) => setFilterTahun(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        >
          <option value="">-- Semua Tahun --</option>
          {uniqueYears.map((year) => (
            <option key={String(year)} value={String(year)}>{year}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter Sekolah..."
          value={filterSekolah}
          onChange={(e) => setFilterSekolah(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        />
        <select
          value={filterTipeSk}
          onChange={(e) => setFilterTipeSk(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        >
          <option value="">-- Semua Tipe SK --</option>
          {uniqueTipeSk.map((tipe) => (
            <option key={String(tipe)} value={String(tipe)}>{tipe}</option>
          ))}
        </select>
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
          value={filterRt}
          onChange={(e) => setFilterRt(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        >
          <option value="">-- Semua RT --</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num.toString()}>{num}</option>
          ))}
        </select>
        <select
          value={filterRw}
          onChange={(e) => setFilterRw(e.target.value)}
          className="w-full rounded-md border border-zinc-300 p-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
        >
          <option value="">-- Semua RW --</option>
          {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={num.toString()}>{num}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-zinc-500">Memuat data...</div>
      ) : (
        <>
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tahun</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Siswa</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">NISN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kelas</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Sekolah</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Ibu</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">RT / RW</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Kelurahan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Virtual Account</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">No. Rekening</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tahap</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nominal</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tipe SK</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nomor SK</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">NIK</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Pengusul</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nama Ayah</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tanggal SK</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length > 0 ? (
                  currentData.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.tahun || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        <button
                          onClick={() => setSelectedPencairan(item)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {item.nama_siswa || '-'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.nisn || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.kelas || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.nama_sekolah || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.nama_ibu || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.rt && item.rw ? `${item.rt} / ${item.rw}` : '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.kelurahan?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.virtual_account || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.nomer_rekening || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.tahap || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.nominal ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.nominal) : '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.tipe_sk || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.nomor_sk || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.nik || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.nama_pengusul || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.nama_ayah || '-'}</td>
                      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{item.tanggal_sk ? new Date(item.tanggal_sk).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={16} className="px-6 py-8 text-center text-zinc-600 dark:text-zinc-400">
                      Belum ada data pencairan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {!isLoading && filteredData.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Menampilkan {startIndex + 1} sampai {Math.min(endIndex, filteredData.length)} dari {filteredData.length} data
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
        </>
      )}

      {/* Modal Detail Pencairan */}
      {selectedPencairan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Detail Pencairan</h3>
              <button onClick={() => setSelectedPencairan(null)} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400">
                ✕
              </button>
            </div>
            <div className="space-y-0 divide-y divide-zinc-100 dark:divide-zinc-700">
              <DetailRow label="Nama Siswa" value={selectedPencairan.nama_siswa} />
              <DetailRow label="NISN" value={selectedPencairan.nisn} />
              <DetailRow label="Kelas" value={selectedPencairan.kelas} />
              <DetailRow label="Nama Sekolah" value={selectedPencairan.nama_sekolah} />
              <DetailRow label="Nama Ibu" value={selectedPencairan.nama_ibu} />
              <DetailRow label="RT / RW" value={selectedPencairan.rt && selectedPencairan.rw ? `${selectedPencairan.rt} / ${selectedPencairan.rw}` : '-'} />
              <DetailRow label="Kelurahan" value={selectedPencairan.kelurahan?.name || '-'} />
              <DetailRow label="Virtual Account" value={selectedPencairan.virtual_account} />
              <DetailRow label="Nomer Rekening" value={selectedPencairan.nomer_rekening} />
              <DetailRow label="Tahap" value={selectedPencairan.tahap} />
              <DetailRow label="Nominal" value={selectedPencairan.nominal ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(selectedPencairan.nominal) : '-'} />
              <DetailRow label="Tipe SK" value={selectedPencairan.tipe_sk} />
              <DetailRow label="Nomor SK" value={selectedPencairan.nomor_sk} />
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedPencairan(null)} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string | number | null }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="col-span-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value || '-'}</div>
    </div>
  );
}