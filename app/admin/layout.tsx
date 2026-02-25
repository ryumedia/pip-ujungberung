import Link from 'next/link';
import { ReactNode } from 'react';
import LogoutButton from './LogoutButton';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-900">
      {/* Sidebar */}
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex-1">
          <div className="flex h-16 items-center justify-center border-b border-zinc-200 dark:border-zinc-700">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Admin PIP</h1>
          </div>
          <nav className="p-4">
            <ul className="space-y-2">
              {[
                { name: 'Dashboard', href: '/admin/dashboard' },
                { name: 'Data Kelurahan', href: '/admin/data-kelurahan' },
                { name: 'Data User', href: '/admin/data-user' },
                { name: 'Data Siswa', href: '/admin/data-siswa' },
                { name: 'Pengajuan', href: '/admin/pengajuan' },
                { name: 'Pencairan', href: '/admin/pencairan' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="block rounded-md p-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-blue-400"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {/* Tombol Logout di bagian bawah */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-700">
          <Link
            href="/pengajuan"
            className="mb-3 block w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Kembali ke Menu Utama
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}