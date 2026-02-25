'use client';

import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh(); // Penting untuk membersihkan state sisi server
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-md bg-zinc-200 p-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-red-500 hover:text-white dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-red-600"
    >
      Logout
    </button>
  );
}