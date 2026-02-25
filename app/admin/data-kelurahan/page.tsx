import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import KelurahanManager from './kelurahan-manager';

export default async function DataKelurahanPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Mengambil data dari tabel 'kelurahan' di Supabase
  const { data: kelurahanData, error } = await supabase
    .from('kelurahan')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching kelurahan data:', error.message);
  }

  return <KelurahanManager initialData={kelurahanData || []} />;
}