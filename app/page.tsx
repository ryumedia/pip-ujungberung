'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '../utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/pengajuan');
      router.refresh();
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    if (!email) {
      setError('Mohon isi email terlebih dahulu untuk reset password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setError('Gagal mengirim email reset: ' + error.message);
    } else {
      setError('Link reset password telah dikirim ke email Anda. Silakan cek inbox.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-900">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md dark:bg-zinc-800"
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Login Admin
        </h2>
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border p-3"
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border p-3"
          />
        </div>
        
        {error && (
          <p className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 p-3 text-white hover:bg-blue-700"
        >
          {loading ? 'Memproses...' : 'Log In'}
        </button>
        <button
          type="button"
          onClick={handlePasswordReset}
          className="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
        >
          Lupa Password?
        </button>
      </form>
    </div>
  );
}