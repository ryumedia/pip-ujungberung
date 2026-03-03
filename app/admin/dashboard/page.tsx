"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function RekapitulasiSiswa({
  totalSiswa,
  uniqueFathers,
  uniqueMothers,
}: {
  totalSiswa: number;
  uniqueFathers: number;
  uniqueMothers: number;
}) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium leading-6 text-zinc-900 dark:text-zinc-100">
        Rekapitulasi Siswa
      </h3>
      <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    Jumlah Siswa
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {totalSiswa}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    Jumlah Ayah (Unik)
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {uniqueFathers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    Jumlah Ibu (Unik)
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {uniqueMothers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RekapitulasiPengajuan({
  totalPengajuan,
  statusCounts,
}: {
  totalPengajuan: number;
  statusCounts: { [key: string]: number };
}) {
  const statuses = [
    { key: "Menunggu", label: "Menunggu" },
    { key: "Diinput", label: "Diinput" },
    { key: "Tidak Layak PIP", label: "Tidak Layak PIP" },
    { key: "Sudah SK", label: "Sudah SK" },
    { key: "Diajukan Lain", label: "Diajukan Lain" },
    { key: "Tidak Terdaftar", label: "Tidak Terdaftar" },
    { key: "Tidak Diajukan", label: "Tidak Diajukan" },
  ];

  const statusColors: { [key: string]: string } = {
    "Menunggu": "bg-gray-100 dark:bg-gray-900/20",
    "Diinput": "bg-green-100 dark:bg-green-900/20",
    "Tidak Layak PIP": "bg-orange-100 dark:bg-orange-900/20",
    "Sudah SK": "bg-purple-100 dark:bg-purple-900/20",
    "Diajukan Lain": "bg-yellow-100 dark:bg-yellow-900/20",
    "Tidak Terdaftar": "bg-zinc-200 dark:bg-zinc-900/20",
    "Tidak Diajukan": "bg-red-100 dark:bg-red-900/20",
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium leading-6 text-zinc-900 dark:text-zinc-100">
        Rekapitulasi Pengajuan
      </h3>
      <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-zinc-800">
          <div className="p-5">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                Jumlah Pengajuan
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                {totalPengajuan}
              </dd>
            </dl>
          </div>
        </div>
        {statuses.map((status) => (
          <div
            key={status.key}
            className={`overflow-hidden rounded-lg shadow ${
              statusColors[status.key] || "bg-white dark:bg-zinc-800"
            }`}
          >
            <div className="p-5">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  {status.label}
                </dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  {statusCounts[status.key] || 0}
                </dd>
              </dl>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RekapitulasiJenjang({ jenjangCounts }: { jenjangCounts: { [key: string]: number } }) {
  const jenjangLevels = [
    { key: 'SD', label: 'SD' },
    { key: 'SMP', label: 'SMP' },
    { key: 'SMA', label: 'SMA' },
    { key: 'SMK', label: 'SMK' },
    { key: 'Lainnya', label: 'Lainnya' },
  ];

  const jenjangColors: { [key: string]: string } = {
    "SD": "bg-red-200 dark:bg-red-900/20",
    "SMP": "bg-blue-200 dark:bg-blue-900/20",
    "SMA": "bg-zinc-300 dark:bg-zinc-900/20",
    "SMK": "bg-green-200 dark:bg-green-900/20",
    "Lainnya": "bg-gray-100 dark:bg-gray-900/20",
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium leading-6 text-zinc-900 dark:text-zinc-100">
        Rekapitulasi Jenjang
      </h3>
      <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {jenjangLevels.map((jenjang) => (
          <div
            key={jenjang.key}
            className={`overflow-hidden rounded-lg shadow ${
              jenjangColors[jenjang.key] || "bg-white dark:bg-zinc-800"
            }`}
          >
            <div className="p-5">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  {jenjang.label}
                </dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                  {jenjangCounts[jenjang.key] || 0}
                </dd>
              </dl>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<any[]>([]);
  const [pengajuan, setPengajuan] = useState<any[]>([]);
  const [kelurahanList, setKelurahanList] = useState<any[]>([]);
  const [year, setYear] = useState(
    searchParams.get("year") || "all"
  );
  const [kelurahan, setKelurahan] = useState(
    searchParams.get("kelurahan") || "all"
  );
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [uniqueFathers, setUniqueFathers] = useState(0);
  const [uniqueMothers, setUniqueMothers] = useState(0);
  const [totalPengajuan, setTotalPengajuan] = useState(0);
  const [statusCounts, setStatusCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [jenjangCounts, setJenjangCounts] = useState<{ [key: string]: number }>(
    {}
  );
  const [loading, setLoading] = useState(true);

  const getYears = () => {
    const years = new Set<string>();
    students.forEach((student) => {
      if (student.created_at)
        years.add(new Date(student.created_at).getFullYear().toString());
    });
    pengajuan.forEach((p) => {
      if (p.created_at)
        years.add(new Date(p.created_at).getFullYear().toString());
    });
    // Sort descending
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  };

  useEffect(() => {
    const fetchAllStudents = async () => {
      let allStudents: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("students")
          // Select all columns, including kelurahan_id. No need for a join here
          // as filtering will be done via ID.
          .select("*")
          .range(page * 1000, (page + 1) * 1000 - 1)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
          hasMore = false;
        } else {
          allStudents = [...allStudents, ...data];
          if (data.length < 1000) {
            hasMore = false;
          }
          page++;
        }
      }
      setStudents(allStudents);
    };

    const fetchAllPengajuan = async () => {
      let allPengajuan: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("pengajuan")
          .select("*")
          .range(page * 1000, (page + 1) * 1000 - 1)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching pengajuan:", error);
          hasMore = false;
        } else {
          allPengajuan = [...allPengajuan, ...data];
          if (data.length < 1000) {
            hasMore = false;
          }
          page++;
        }
      }
      setPengajuan(allPengajuan);
    };

    const fetchKelurahan = async () => {
      // Fetch ID and name to use ID as value in the filter dropdown
      const { data, error } = await supabase
        .from("kelurahan")
        .select("id, name");
      if (error) {
        console.error(error);
      } else {
        setKelurahanList(data);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAllStudents(),
        fetchAllPengajuan(),
        fetchKelurahan(),
      ]);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  useEffect(() => {
    // Saring siswa berdasarkan kelurahan terlebih dahulu.
    const studentsInKelurahan = students.filter(student => {
      if (kelurahan === "all") return true;
      const sKelId = String(student.kelurahan_id ?? student.kelurahan ?? "").trim();
      const selectedKelData = kelurahanList.find((k) => String(k.id) === kelurahan);
      const matchById = sKelId === kelurahan;
      const matchByName = selectedKelData ? sKelId.toLowerCase() === selectedKelData.name.toLowerCase() : false;
      return matchById || matchByName;
    });

    // --- 1. Hitung Rekapitulasi Siswa ---
    const filteredStudentsForYear = studentsInKelurahan.filter(student => {
      const studentYear = new Date(student.created_at).getFullYear().toString();
      return year === "all" || studentYear === year;
    });

    setTotalSiswa(filteredStudentsForYear.length);
    setUniqueFathers(new Set(filteredStudentsForYear.map((s) => s.nama_ayah)).size);
    setUniqueMothers(new Set(filteredStudentsForYear.map((s) => s.nama_ibu)).size);

    // --- 2. Hitung Rekapitulasi Pengajuan ---
    const filteredPengajuan = pengajuan.filter((p) => {
      const pYear = new Date(p.created_at).getFullYear().toString();
      const yearMatch = year === "all" || pYear === year;
      const kelurahanMatch =
        kelurahan === "all" || String(p.kelurahan_id) === kelurahan;
      return yearMatch && kelurahanMatch;
    });

    setTotalPengajuan(filteredPengajuan.length);

    const initialCounts = {
      "Menunggu": 0, "Diinput": 0, "Tidak Layak PIP": 0,
      "Sudah SK": 0, "Diajukan Lain": 0,
      "Tidak Terdaftar": 0, "Tidak Diajukan": 0,
    };

    const normalizedStatusMap: { [key: string]: string } = {};
    Object.keys(initialCounts).forEach((key) => {
      normalizedStatusMap[key.toLowerCase()] = key;
    });

    const counts = filteredPengajuan.reduce((acc, p) => {
      // Menggunakan kolom 'ststus' sesuai instruksi
      const statusRaw = p.status_pengajuan ? String(p.status_pengajuan).trim() : "";
      const statusKey = normalizedStatusMap[statusRaw.toLowerCase()];
      if (statusKey) {
        acc[statusKey]++;
      }
      return acc;
    }, initialCounts);
    setStatusCounts(counts);

    // --- 3. Hitung Rekapitulasi Jenjang ---
    const jenjangInitialCounts = { SD: 0, SMP: 0, SMA: 0, SMK: 0, Lainnya: 0 };
    filteredPengajuan.forEach((p) => {
        if (p.nama_sekolah) {
            const schoolName = p.nama_sekolah.toUpperCase().trim();
            if (schoolName.startsWith('SD')) {
                jenjangInitialCounts.SD++;
            } else if (schoolName.startsWith('SMP')) {
                jenjangInitialCounts.SMP++;
            } else if (schoolName.startsWith('SMA')) {
                jenjangInitialCounts.SMA++;
            } else if (schoolName.startsWith('SMK')) {
                jenjangInitialCounts.SMK++;
            } else {
                jenjangInitialCounts.Lainnya++;
            }
        } else {
            jenjangInitialCounts.Lainnya++;
        }
    });
    setJenjangCounts(jenjangInitialCounts);
  }, [students, pengajuan, year, kelurahan, kelurahanList]);

  const handleReset = () => {
    setYear("all");
    setKelurahan("all");
    router.push(`/admin/dashboard?year=all&kelurahan=all`);
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Dashboard
      </h2>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        Selamat datang di panel admin PIP Kecamatan Ujungberung.
      </p>

      <div className="mt-6">
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="year" className="sr-only">
              Tahun
            </label>
            <select
              id="year"
              name="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">Semua Tahun</option>
              {getYears().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="kelurahan" className="sr-only">
              Kelurahan
            </label>
            <select
              id="kelurahan"
              name="kelurahan"
              value={kelurahan}
              onChange={(e) => setKelurahan(e.target.value)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">Semua Kelurahan</option>
              {kelurahanList?.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md bg-zinc-500 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          >
            Reset
          </button>
        </div>
      </div>
      <RekapitulasiSiswa
        totalSiswa={totalSiswa}
        uniqueFathers={uniqueFathers}
        uniqueMothers={uniqueMothers}
      />
      <RekapitulasiPengajuan
        totalPengajuan={totalPengajuan}
        statusCounts={statusCounts}
      />
      <RekapitulasiJenjang jenjangCounts={jenjangCounts} />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}