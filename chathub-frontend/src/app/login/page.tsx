'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
      const response = await fetch('http://localhost:3000/auth/login', {
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
      setToken(data.access_token);
      router.push('/'); // Redirige a la página principal

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-japifon-dark-blue">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <Image src="/globe.svg" alt="Japifon Logo" width={48} height={48} className="mx-auto mb-4 text-japifon-blue" />
          <h1 className="text-4xl font-bold text-japifon-dark-blue">Japifon</h1>
          <p className="text-japifon-gray-mid">Welcome to ChatHub</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-700">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-japifon-blue focus:border-japifon-blue"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-japifon-blue focus:border-japifon-blue"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-japifon-blue hover:bg-japifon-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-japifon-blue"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
