'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function LoginPage() {
  const [username, setUsername] = useState('testuser'); // Default for easy testing
  const [password, setPassword] = useState('password123'); // Default for easy testing
  const [error, setError] = useState<string | null>(null);

  const { setToken } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to login');
      }

      const data = await response.json();
      setToken(data.access_token, data.user);
      router.push('/'); // Redirige a la página principal

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#10276F] via-[#173DA6] to-[#E4007C] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl">
        <div className="text-center">
          <Image src="/globe.svg" alt="Japifon Logo" width={48} height={48} className="mx-auto mb-4 text-japifon-blue" />
          <h1 className="text-3xl font-bold text-[#10276F]">Japifon</h1>
          <p className="text-sm text-slate-500">Accede a tu bandeja omnicanal</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" className="text-sm font-medium text-slate-700">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm placeholder-slate-400 focus:border-[#255FED] focus:outline-none focus:ring-2 focus:ring-[#255FED]/40"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm placeholder-slate-400 focus:border-[#255FED] focus:outline-none focus:ring-2 focus:ring-[#255FED]/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center rounded-lg bg-gradient-to-r from-[#255FED] to-[#E4007C] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#255FED]"
            >
              Entrar
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Aún no tienes cuenta?{' '}
          <Link
            href="/register"
            className="font-semibold text-[#255FED] hover:text-[#10276F]"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
