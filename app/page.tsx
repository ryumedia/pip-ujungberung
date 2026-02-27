import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            PIP Ujungberung
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Sistem Manajemen Data & Pengajuan
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/pengajuan"
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Masuk ke Pengajuan
          </Link>
        </div>
      </div>
    </div>
  );
}
